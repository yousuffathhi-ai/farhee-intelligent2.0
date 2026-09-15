/**
 * End-to-End Encryption (E2EE) Engine for farhee intelligent 2.0
 * Uses native Web Crypto API with AES-256-GCM and PBKDF2 Key Derivation
 */

const DEFAULT_SALT = new TextEncoder().encode("farhee-intelligent-2.0-e2ee-master-salt");

// Generates or derives a CryptoKey from a user passphrase or session secret
export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: DEFAULT_SALT,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Computes a visual hex fingerprint for UI verification
export async function getFingerprint(passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(passphrase));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":")
    .toUpperCase();
}

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  timestamp: number;
}

// Encrypts plaintext string using AES-GCM
export async function encryptText(text: string, key: CryptoKey): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    enc.encode(text)
  );

  const cipherArray = Array.from(new Uint8Array(cipherBuffer));
  const cipherText = btoa(String.fromCharCode(...cipherArray));
  const ivStr = btoa(String.fromCharCode(...Array.from(iv)));

  return {
    cipherText,
    iv: ivStr,
    timestamp: Date.now(),
  };
}

// Decrypts ciphertext string using AES-GCM
export async function decryptText(encrypted: EncryptedPayload, key: CryptoKey): Promise<string> {
  const dec = new TextDecoder();
  const ivBinary = atob(encrypted.iv);
  const iv = new Uint8Array(ivBinary.length);
  for (let i = 0; i < ivBinary.length; i++) {
    iv[i] = ivBinary.charCodeAt(i);
  }

  const cipherBinary = atob(encrypted.cipherText);
  const cipherBytes = new Uint8Array(cipherBinary.length);
  for (let i = 0; i < cipherBinary.length; i++) {
    cipherBytes[i] = cipherBinary.charCodeAt(i);
  }

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    cipherBytes
  );

  return dec.decode(decryptedBuffer);
}

// Helper to encrypt an arbitrary JSON object
export async function encryptObject<T>(obj: T, key: CryptoKey): Promise<EncryptedPayload> {
  const json = JSON.stringify(obj);
  return encryptText(json, key);
}

// Helper to decrypt an arbitrary JSON object
export async function decryptObject<T>(encrypted: EncryptedPayload, key: CryptoKey): Promise<T> {
  const json = await decryptText(encrypted, key);
  return JSON.parse(json) as T;
}
