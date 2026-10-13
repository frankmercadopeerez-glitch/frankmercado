module.exports = (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método no permitido." });
  }

  const publicKey = process.env.WEB_PUSH_PUBLIC_KEY;
  if (!publicKey) {
    return res.status(503).json({
      enabled: false,
      error: "Las notificaciones aún no están configuradas en el servidor.",
    });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ enabled: true, publicKey });
};
