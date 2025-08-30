import crypto from "node:crypto";
const ALG = "aes-256-gcm";
const KEY_B64 = process.env.SECRET_ENC_KEY || "";
if (!KEY_B64) console.warn("SECRET_ENC_KEY not set");
const KEY = KEY_B64 ? Buffer.from(KEY_B64, "base64") : Buffer.alloc(32, 0); // 32 bytes

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, KEY, iv);
  const enc = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64"); // iv|tag|ciphertext
}

export function decrypt(b64) {
  const buf = Buffer.from(String(b64), "base64");
  const iv = buf.subarray(0,12);
  const tag = buf.subarray(12,28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALG, KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}
