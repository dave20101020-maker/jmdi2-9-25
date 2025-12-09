import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = process.env.PSYCHOMETRIC_SECRET
  ? crypto.createHash("sha256").update(process.env.PSYCHOMETRIC_SECRET).digest()
  : null;

function getIv() {
  return crypto.randomBytes(12);
}

export function encryptPsychometrics(payload) {
  if (!KEY || !payload) return null;
  const iv = getIv();
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const serialized = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(serialized, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    version: "v1",
  };
}

export function decryptPsychometrics(record) {
  if (!KEY || !record?.cipherText || !record?.iv || !record?.authTag)
    return null;
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY,
      Buffer.from(record.iv, "base64")
    );
    decipher.setAuthTag(Buffer.from(record.authTag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(record.cipherText, "base64")),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch (error) {
    return null;
  }
}
