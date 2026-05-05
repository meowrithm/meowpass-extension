// Crypto operations — byte-compatible with Go CLI (pkg/crypto/)
// Argon2id + AES-256-GCM with nonce appended to end of ciphertext

import { argon2id } from "hash-wasm";

const NONCE_SIZE = 12; // GCM standard

// ── Argon2id Key Derivation ──
// Matches Go: time=3, mem=64MB, threads=4, keyLen=32, saltLen=16
export async function deriveKey(password, saltBytes) {
  const salt = saltBytes || crypto.getRandomValues(new Uint8Array(16));
  const keyHex = await argon2id({
    password,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 64 * 1024, // 64MB in KB
    hashLength: 32,
    outputType: "hex",
  });
  return { key: hexToBytes(keyHex), salt };
}

// ── AES-256-GCM Encrypt ──
// Output: ciphertext || nonce (nonce appended at end, matches Go Encrypt)
export async function encrypt(plaintext, keyBytes) {
  const key = await importKey(keyBytes);
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    plaintext
  );
  // Append nonce to end (same as Go)
  const result = new Uint8Array(ciphertext.byteLength + NONCE_SIZE);
  result.set(new Uint8Array(ciphertext), 0);
  result.set(nonce, ciphertext.byteLength);
  return result;
}

// ── AES-256-GCM Decrypt ──
// Input: ciphertext || nonce (last 12 bytes are nonce, matches Go Decrypt)
export async function decrypt(data, keyBytes) {
  if (data.length < NONCE_SIZE) throw new Error("ciphertext too short");
  const key = await importKey(keyBytes);
  const ciphertext = data.slice(0, data.length - NONCE_SIZE);
  const nonce = data.slice(data.length - NONCE_SIZE);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    ciphertext
  );
  return new Uint8Array(plaintext);
}

// ── Vault Key Operations ──
export function generateVaultKey() {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function encryptVaultKey(vaultKey, masterKey) {
  return encrypt(vaultKey, masterKey);
}

export async function decryptVaultKey(encryptedKey, masterKey) {
  return decrypt(encryptedKey, masterKey);
}

// ── Helpers ──
function importKey(keyBytes) {
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
