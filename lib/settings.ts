import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { db } from "./db";

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret";
  return createHash("sha256").update(secret).digest();
}

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = getEncryptionKey();
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string): string {
  const [ivHex, encHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = getEncryptionKey();
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    const row = await db.appSettings.findUnique({ where: { key } });
    if (!row) return null;
    return row.isEncrypted ? decrypt(row.value) : row.value;
  } catch {
    return null;
  }
}

export async function setSetting(
  key: string,
  value: string,
  encrypted = false
): Promise<void> {
  const stored = encrypted ? encrypt(value) : value;
  await db.appSettings.upsert({
    where: { key },
    update: { value: stored, isEncrypted: encrypted },
    create: { key, value: stored, isEncrypted: encrypted },
  });
}
