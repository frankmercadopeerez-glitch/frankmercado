const admin = require("firebase-admin");

function getAdminApp() {
  if (admin.apps.length) return admin.app();

  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) {
    throw new Error("Falta FIREBASE_SERVICE_ACCOUNT_JSON en el entorno.");
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch (error) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON no contiene JSON válido.");
  }

  return admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

function getFirestore() {
  return getAdminApp().firestore();
}

async function requireUser(req) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!token) {
    const error = new Error("Inicia sesión para administrar las notificaciones.");
    error.statusCode = 401;
    throw error;
  }

  try {
    return await getAdminApp().auth().verifyIdToken(token);
  } catch (cause) {
    const error = new Error("La sesión no pudo verificarse.");
    error.statusCode = 401;
    error.cause = cause;
    throw error;
  }
}

module.exports = { getFirestore, requireUser };
