// Ejecutar solo en una terminal segura: las claves privadas nunca van al repositorio.
const { generateKeyPairSync } = require("node:crypto");

const base64url = (value) => Buffer.from(value).toString("base64url");
const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const publicJwk = publicKey.export({ format: "jwk" });
const privateJwk = privateKey.export({ format: "jwk" });

const publicRaw = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(publicJwk.x, "base64url"),
  Buffer.from(publicJwk.y, "base64url"),
]);

console.log("WEB_PUSH_PUBLIC_KEY=" + base64url(publicRaw));
console.log("WEB_PUSH_PRIVATE_KEY=" + privateJwk.d);
console.log("WEB_PUSH_SUBJECT=mailto:tu-correo@ejemplo.com");
