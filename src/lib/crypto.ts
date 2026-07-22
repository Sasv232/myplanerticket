import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

if (!process.env.E2E_SECRET) {
  throw new Error("E2E_SECRET не задан! Добавьте E2E_SECRET в .env.local");
}
const E2E_SECRET = process.env.E2E_SECRET;

function deriveKey(userId: string, salt: Buffer): Buffer {
  return pbkdf2Sync(E2E_SECRET + userId, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512");
}

export function encryptMessage(plainText: string, userId: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(userId, salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return [
    salt.toString("hex"),
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted,
  ].join(":");
}

export function decryptMessage(encryptedData: string, userId: string): string {
  const [saltHex, ivHex, authTagHex, encrypted] = encryptedData.split(":");
  if (!saltHex || !ivHex || !authTagHex || !encrypted) {
    return encryptedData;
  }

  const salt = Buffer.from(saltHex, "hex");
  const key = deriveKey(userId, salt);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function isEncrypted(data: string): boolean {
  const parts = data.split(":");
  return parts.length === 4;
}

export function decryptIfEncrypted(data: string, userId: string): string {
  if (isEncrypted(data)) {
    try {
      return decryptMessage(data, userId);
    } catch {
      return "[Зашифрованное сообщение]";
    }
  }
  return data;
}
