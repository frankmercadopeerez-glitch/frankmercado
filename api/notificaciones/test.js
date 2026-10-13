const { getFirestore, requireUser } = require("../_lib/firebase-admin");
const { getWebPush } = require("../_lib/web-push");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const user = await requireUser(req);
    const db = getFirestore();
    const devices = await db
      .collection("notificaciones_dispositivos_frank")
      .where("uid", "==", user.uid)
      .get();

    if (devices.empty) {
      return res.status(404).json({ error: "No hay un teléfono suscrito para esta cuenta." });
    }

    const payload = JSON.stringify({
      title: "Notificaciones activadas",
      body: "Finanzas Frank te avisará 2 días antes, 1 día antes y el día de cada pago.",
      url: "/finanzas/?tab=pagos",
      tag: "finanzas-prueba",
    });
    const webpush = getWebPush();
    const results = await Promise.allSettled(
      devices.docs.map(async (device) => {
        const { subscription } = device.data();
        try {
          await webpush.sendNotification(subscription, payload, { TTL: 60 });
          await device.ref.set({ lastTestedAt: new Date().toISOString() }, { merge: true });
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) await device.ref.delete();
          throw error;
        }
      }),
    );

    const sent = results.filter((result) => result.status === "fulfilled").length;
    if (!sent) throw new Error("No se pudo entregar la prueba a este dispositivo.");
    return res.status(200).json({ sent });
  } catch (error) {
    console.error("payment-notification-test", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "No se pudo enviar la prueba." });
  }
};
