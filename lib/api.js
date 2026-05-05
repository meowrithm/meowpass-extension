// API client for MeowPass

const BASE = "https://7t5hq0otg4.execute-api.us-west-2.amazonaws.com";

import { getToken } from "./store.js";

async function request(method, path, body) {
  const token = await getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const resp = await fetch(BASE + path, opts);
  if (resp.status === 204) return null;

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(data?.error || `API error (${resp.status})`);
  }
  return data;
}

// Auth
export const login = (email, password) =>
  request("POST", "/auth/login", { email, password });

export const register = (email, name, password) =>
  request("POST", "/auth/register", { email, name, password });

export const getMe = () => request("GET", "/auth/me");

export const updateKeys = (publicKey, keySalt) =>
  request("PUT", "/auth/me/keys", { public_key: publicKey, key_salt: keySalt });

// Vaults
export const listVaults = () => request("GET", "/vaults");
export const getVault = (id) => request("GET", `/vaults/${id}`);
export const createVault = (name, encryptedKey) =>
  request("POST", "/vaults", { name, encrypted_key: encryptedKey });
export const deleteVault = (id) => request("DELETE", `/vaults/${id}`);

// Secrets
export const listSecrets = (vaultId) =>
  request("GET", `/vaults/${vaultId}/secrets`);
export const getSecret = (vaultId, key) =>
  request("GET", `/vaults/${vaultId}/secrets/${key}`);
export const setSecret = (vaultId, key, encryptedValue) =>
  request("PUT", `/vaults/${vaultId}/secrets/${key}`, {
    encrypted_value: encryptedValue,
    nonce: [],
  });
export const deleteSecret = (vaultId, key) =>
  request("DELETE", `/vaults/${vaultId}/secrets/${key}`);

// Subscription
export const getSubscription = () => request("GET", "/subscription");
