const webpush = require("web-push");

function getWebPush() {
  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Falta configurar las claves WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY o WEB_PUSH_SUBJECT.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

module.exports = { getWebPush };
