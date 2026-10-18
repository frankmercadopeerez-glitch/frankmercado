const { getFirestore } = require("../_lib/firebase-admin");
const { getWebPush } = require("../_lib/web-push");

function colombiaDateParts(now = new Date()) {
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => values.find((value) => value.type === type).value;
  return { year: Number(part("year")), month: Number(part("month")), day: Number(part("day")) };
}

function isoDate({ year, month, day }) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addMonths(date, months) {
  const first = new Date(Date.UTC(date.year, date.month - 1 + months, 1));
  return { year: first.getUTCFullYear(), month: first.getUTCMonth() + 1, day: 1 };
}

function daysBetween(from, to) {
  return Math.round((Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)) / 86400000);
}

function dueDate(month, configuredDay) {
  const lastDay = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
  return { ...month, day: Math.min(Math.max(1, Number(configuredDay)), lastDay) };
}

function copySubscription(data) {
  const subscription = data.subscription || {};
  return { endpoint: subscription.endpoint, keys: subscription.keys };
}

module.exports = async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "No autorizado." });
  }

  try {
    const db = getFirestore();
    const today = colombiaDateParts();
    const [paymentsSnapshot, checksSnapshot, devicesSnapshot] = await Promise.all([
      db.collection("pagos_recurrentes_frank").where("activo", "!=", false).get(),
      db.collection("pagos_checks_frank").where("pagado", "==", true).get(),
      db.collection("notificaciones_dispositivos_frank").get(),
    ]);
    const paid = new Set(checksSnapshot.docs.map((doc) => {
      const check = doc.data();
      return `${check.pagoId}:${check.mes}:${check.diaPago}`;
    }));
    const devices = devicesSnapshot.docs;
    const webpush = getWebPush();
    const pendingSends = [];

    for (const paymentDoc of paymentsSnapshot.docs) {
      const payment = paymentDoc.data();
      if (payment.recordatorioActivo === false) continue;
      for (const configuredDay of payment.diasPago || []) {
        for (const offsetMonth of [0, 1]) {
          const month = addMonths(today, offsetMonth);
          const due = dueDate(month, configuredDay);
          const daysUntil = daysBetween(today, due);
          if (![0, 1, 2].includes(daysUntil)) continue;

          const monthKey = `${due.year}-${String(due.month).padStart(2, "0")}`;
          if (paid.has(`${paymentDoc.id}:${monthKey}:${configuredDay}`)) continue;

          const reminderKey = `${isoDate(today)}_${paymentDoc.id}_${monthKey}_${configuredDay}`;
          const reminderRef = db.collection("notificaciones_envios_frank").doc(reminderKey);
          const alreadySent = await reminderRef.get();
          if (alreadySent.exists) continue;

          const when = daysUntil === 0 ? "vence hoy" : daysUntil === 1 ? "vence mañana" : "vence en 2 días";
          const amount = payment.moneda === "USD"
            ? `US$ ${Number(payment.monto || 0).toLocaleString("es-CO")}`
            : `$ ${Number(payment.monto || 0).toLocaleString("es-CO")}`;
          const payload = JSON.stringify({
            title: "Pago pendiente",
            body: `${payment.nombre || "Pago recurrente"} · ${amount} ${when}.`,
            url: "/finanzas/?tab=pagos",
            tag: `pago-${paymentDoc.id}-${monthKey}-${configuredDay}`,
          });

          const deliveries = await Promise.allSettled(devices.map(async (device) => {
            try {
              await webpush.sendNotification(copySubscription(device.data()), payload, { TTL: 86400 });
            } catch (error) {
              if (error.statusCode === 404 || error.statusCode === 410) await device.ref.delete();
              throw error;
            }
          }));
          const delivered = deliveries.filter((item) => item.status === "fulfilled").length;
          if (!delivered) continue;

          pendingSends.push(reminderRef.set({
            paymentId: paymentDoc.id,
            dueDate: isoDate(due),
            configuredDay: Number(configuredDay),
            daysUntil,
            sentAt: new Date().toISOString(),
            delivered,
          }));
        }
      }
    }

    await Promise.all(pendingSends);
    return res.status(200).json({ ok: true, remindersSent: pendingSends.length, date: isoDate(today) });
  } catch (error) {
    console.error("payment-reminder-cron", error);
    return res.status(500).json({ error: error.message || "No se pudieron revisar los pagos." });
  }
};
