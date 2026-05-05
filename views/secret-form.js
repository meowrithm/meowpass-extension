import * as api from "../lib/api.js";
import { getMasterKey } from "../lib/store.js";
import {
  encrypt,
  decrypt,
  decryptVaultKey,
  hexToBytes,
  base64ToBytes,
} from "../lib/crypto.js";

async function getVaultKey(vaultId) {
  const mkHex = await getMasterKey();
  if (!mkHex) throw new Error("session_expired");
  const masterKey = hexToBytes(mkHex);
  const vault = await api.getVault(vaultId);
  const encKeyBytes = vault.encrypted_key instanceof Array
    ? new Uint8Array(vault.encrypted_key)
    : base64ToBytes(vault.encrypted_key);
  return decryptVaultKey(encKeyBytes, masterKey);
}

export function render(container, navigate, params) {
  const { vaultId, vaultName, mode, keyName } = params;
  const isEdit = mode === "edit";

  container.innerHTML = `
    <div class="view-header row">
      <button id="back-btn" class="btn-icon" title="Back">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h2>${isEdit ? "Edit Secret" : "Add Secret"}</h2>
      <div></div>
    </div>
    <form id="secret-form">
      <label>Key Name</label>
      <input type="text" id="key-name" placeholder="STRIPE_SECRET_KEY" value="${keyName || ""}" ${isEdit ? "readonly" : "required"} />
      <label>Value</label>
      <textarea id="secret-value" placeholder="Enter secret value..." rows="4" required></textarea>
      <div id="error" class="error hidden"></div>
      <button type="submit" id="save-btn">${isEdit ? "Update" : "Save"} Secret</button>
    </form>
  `;

  document.getElementById("back-btn").addEventListener("click", () =>
    navigate("secrets", { vaultId, vaultName })
  );

  // Load existing value for edit mode
  if (isEdit && keyName) {
    loadExisting(vaultId, keyName, navigate);
  }

  document.getElementById("secret-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("error");
    const btn = document.getElementById("save-btn");
    errEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Encrypting...";

    try {
      const key = document.getElementById("key-name").value.trim();
      const value = document.getElementById("secret-value").value;
      if (!key) throw new Error("Key name required");

      const vaultKey = await getVaultKey(vaultId);
      const plaintext = new TextEncoder().encode(value);
      const encrypted = await encrypt(plaintext, vaultKey);

      await api.setSecret(vaultId, key, Array.from(encrypted));

      navigate("secrets", { vaultId, vaultName });
    } catch (err) {
      if (err.message === "session_expired") { navigate("unlock"); return; }
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = isEdit ? "Update" : "Save";
    }
  });
}

async function loadExisting(vaultId, keyName, navigate) {
  try {
    const vaultKey = await getVaultKey(vaultId);
    const secret = await api.getSecret(vaultId, keyName);
    const encBytes = secret.encrypted_value instanceof Array
      ? new Uint8Array(secret.encrypted_value)
      : base64ToBytes(secret.encrypted_value);
    const plaintext = await decrypt(encBytes, vaultKey);
    document.getElementById("secret-value").value = new TextDecoder().decode(plaintext);
  } catch (err) {
    if (err.message === "session_expired") { navigate("unlock"); return; }
    document.getElementById("secret-value").placeholder = "Failed to decrypt: " + err.message;
  }
}
