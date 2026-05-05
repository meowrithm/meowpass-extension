import * as api from "../lib/api.js";
import { getMasterKey } from "../lib/store.js";
import {
  decrypt,
  decryptVaultKey,
  hexToBytes,
  base64ToBytes,
} from "../lib/crypto.js";

let cachedVaultKey = null;
let cachedVaultId = null;

async function getVaultKey(vaultId) {
  if (cachedVaultKey && cachedVaultId === vaultId) return cachedVaultKey;

  const mkHex = await getMasterKey();
  if (!mkHex) throw new Error("session_expired");
  const masterKey = hexToBytes(mkHex);

  const vault = await api.getVault(vaultId);
  const encKeyBytes = vault.encrypted_key instanceof Array
    ? new Uint8Array(vault.encrypted_key)
    : base64ToBytes(vault.encrypted_key);

  cachedVaultKey = await decryptVaultKey(encKeyBytes, masterKey);
  cachedVaultId = vaultId;
  return cachedVaultKey;
}

export function render(container, navigate, params) {
  const { vaultId, vaultName } = params;

  container.innerHTML = `
    <div class="view-header row">
      <button id="back-btn" class="btn-icon" title="Back">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h2>${vaultName}</h2>
      <button id="add-btn" class="btn-icon" title="Add secret">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>
    <div id="secret-list" class="list"><div class="loading">Loading...</div></div>
  `;

  document.getElementById("back-btn").addEventListener("click", () => navigate("vaults"));
  document.getElementById("add-btn").addEventListener("click", () =>
    navigate("secret-form", { vaultId, vaultName, mode: "add" })
  );

  loadSecrets(vaultId, vaultName, navigate);
}

async function loadSecrets(vaultId, vaultName, navigate) {
  const listEl = document.getElementById("secret-list");
  try {
    const secrets = await api.listSecrets(vaultId);
    if (!secrets || secrets.length === 0) {
      listEl.innerHTML = `<div class="empty">No secrets yet. Click + to add one.</div>`;
      return;
    }

    listEl.innerHTML = secrets
      .map(
        (s) => `
      <div class="list-item secret-item" data-key="${s.key_name}">
        <div class="list-item-info">
          <span class="list-item-name mono">${s.key_name}</span>
          <span class="list-item-meta">v${s.version}</span>
        </div>
        <div class="secret-actions">
          <button class="btn-icon copy-btn" data-key="${s.key_name}" title="Copy">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button class="btn-icon del-btn" data-key="${s.key_name}" title="Delete">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
            </svg>
          </button>
        </div>
      </div>
    `
      )
      .join("");

    // Copy handlers
    listEl.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const key = btn.dataset.key;
        try {
          const vaultKey = await getVaultKey(vaultId);
          const secret = await api.getSecret(vaultId, key);
          const encBytes = secret.encrypted_value instanceof Array
            ? new Uint8Array(secret.encrypted_value)
            : base64ToBytes(secret.encrypted_value);
          const plaintext = await decrypt(encBytes, vaultKey);
          await navigator.clipboard.writeText(new TextDecoder().decode(plaintext));
          btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="#22c55e" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>`;
          setTimeout(() => {
            btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
          }, 1500);
        } catch (err) {
          if (err.message === "session_expired") { navigate("unlock"); return; }
          alert("Failed to decrypt: " + err.message);
        }
      });
    });

    // Delete handlers
    listEl.querySelectorAll(".del-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const key = btn.dataset.key;
        if (!confirm(`Delete ${key}?`)) return;
        try {
          await api.deleteSecret(vaultId, key);
          loadSecrets(vaultId, vaultName, navigate);
        } catch (err) {
          alert(err.message);
        }
      });
    });

    // Click row to edit
    listEl.querySelectorAll(".secret-item").forEach((el) => {
      el.addEventListener("click", () => {
        navigate("secret-form", {
          vaultId,
          vaultName,
          mode: "edit",
          keyName: el.dataset.key,
        });
      });
    });
  } catch (err) {
    if (err.message === "session_expired") { navigate("unlock"); return; }
    listEl.innerHTML = `<div class="error">${err.message}</div>`;
  }
}
