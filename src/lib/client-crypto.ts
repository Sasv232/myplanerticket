const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const CLIENT_SECRET = "mpt-e2e-v3-k8x9m2";

async function deriveKey(conversationId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = encoder.encode(CLIENT_SECRET + ":" + conversationId);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(CLIENT_SECRET),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMessage(plainText: string, conversationId: string): Promise<string> {
  const key = await deriveKey(conversationId);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );

  const encryptedArray = new Uint8Array(encrypted);
  const result = new Uint8Array(iv.length + encryptedArray.length);
  result.set(iv, 0);
  result.set(encryptedArray, iv.length);

  return btoa(String.fromCharCode(...result));
}

export async function decryptMessage(encryptedBase64: string, conversationId: string): Promise<string> {
  try {
    const key = await deriveKey(conversationId);
    const data = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

    if (data.length <= 12) return encryptedBase64;

    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return "[Не удалось расшифровать]";
  }
}

export function isEncrypted(data: string): boolean {
  try {
    const decoded = atob(data);
    return decoded.length > 12;
  } catch {
    return false;
  }
}

export async function decryptIfEncrypted(data: string, conversationId: string): Promise<string> {
  if (isEncrypted(data)) {
    return decryptMessage(data, conversationId);
  }
  return data;
}
