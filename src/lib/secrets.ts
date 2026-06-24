import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "mvenc:v1:";

function deriveKey(): Buffer {
  const secret = process.env.AUTH_SECRET || "metavision-dev-secret-change-me";
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  if (!plain || plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored;
  const body = stored.slice(PREFIX.length);
  const [ivB, tagB, dataB] = body.split(".");
  if (!ivB || !tagB || !dataB) return stored;
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), Buffer.from(ivB, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB, "base64url")), decipher.final()]);
  return dec.toString("utf8");
}
