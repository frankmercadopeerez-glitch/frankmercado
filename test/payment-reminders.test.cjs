const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const notifications = [];
const writes = [];
const doc = (id, data) => ({
  id,
  data: () => data,
  ref: { delete: async () => {}, set: async (value) => writes.push([id, value]) },
});
const collections = {
  pagos_recurrentes_frank: [
    doc("wifi", { activo: true, nombre: "WiFi", monto: 120000, moneda: "COP", diasPago: [13, 14, 15] }),
    doc("already-paid", { activo: true, nombre: "Ya pagado", monto: 1, moneda: "COP", diasPago: [13] }),
  ],
  pagos_checks_frank: [
    doc("check", { pagoId: "already-paid", mes: "2026-10", diaPago: 13, pagado: true }),
  ],
  notificaciones_dispositivos_frank: [
    doc("phone", { subscription: { endpoint: "https://push.example", keys: { p256dh: "a", auth: "b" } } }),
  ],
};
const snapshot = (name) => ({ docs: collections[name] || [], empty: !(collections[name] || []).length });
const db = {
  collection(name) {
    return {
      where: () => ({ get: async () => snapshot(name) }),
      get: async () => snapshot(name),
      doc: (id) => ({
        get: async () => ({ exists: false }),
        set: async (value) => writes.push([id, value]),
      }),
    };
  },
};

const moduleUnderTest = { exports: {} };
const RealDate = Date;
class TestDate extends RealDate {
  constructor(...args) {
    super(...(args.length ? args : ["2026-10-13T14:00:00Z"]));
  }
}

vm.runInNewContext(fs.readFileSync("api/cron/pagos.js", "utf8"), {
  require: (path) => path.includes("firebase-admin")
    ? { getFirestore: () => db }
    : { getWebPush: () => ({ sendNotification: async (subscription, payload) => notifications.push([subscription, JSON.parse(payload)]) }) },
  module: moduleUnderTest,
  console,
  Intl,
  Date: TestDate,
  Number,
  Math,
  Promise,
  Set,
  JSON,
  process: { env: { CRON_SECRET: "secret" } },
});

const response = {
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return value; },
};

moduleUnderTest.exports({ headers: { authorization: "Bearer secret" } }, response).then(() => {
  assert.equal(response.statusCode, 200);
  assert.equal(notifications.length, 3, "sends today, tomorrow, and two-day reminders while skipping a paid one");
  const bodies = notifications.map((notification) => notification[1].body).join("\n");
  assert.match(bodies, /vence hoy/);
  assert.match(bodies, /vence mañana/);
  assert.match(bodies, /vence en 2 días/);
  assert.equal(writes.length, 3, "records every delivery to prevent duplicates");
  console.log("payment reminder scheduling test passed");
});
