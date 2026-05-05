import * as api from "../lib/api.js";
import { getMasterKey, clearToken, clearMasterKey, clearAll } from "../lib/store.js";
import {
  generateVaultKey,
  encryptVaultKey,
  hexToBytes,
  bytesToBase64,
} from "../lib/crypto.js";

export function render(container, navigate) {
  container.innerHTML = `
    <div class="view-header row">
      <div>
        <h2>Vaults</h2>
      </div>
      <button id="logout-btn" class="btn-icon" title="Log out">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
      </button>
    </div>
    <div id="vault-list" class="list"><div class="loading">Loading...</div></div>
    <div id="create-vault" class="create-section">
      <input type="text" id="new-vault-name" placeholder="New vault name" />
      <button id="create-vault-btn">Create</button>
    </div>
  `;

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await clearAll();
    navigate("login");
  });

  loadVaults(navigate);

  document.getElementById("create-vault-btn").addEventListener("click", async () => {
    const name = document.getElementById("new-vault-name").value.trim();
    if (!name) return;

    const btn = document.getElementById("create-vault-btn");
    btn.disabled = true;
    btn.textContent = "Creating...";

    try {
      const mkHex = await getMasterKey();
      if (!mkHex) { navigate("unlock"); return; }
      const masterKey = hexToBytes(mkHex);

      const vaultKey = generateVaultKey();
      const encKey = await encryptVaultKey(vaultKey, masterKey);

      await api.createVault(name, Array.from(encKey));
      document.getElementById("new-vault-name").value = "";
      loadVaults(navigate);
    } catch (err) {
      alert(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Create";
    }
  });
}

async function loadVaults(navigate) {
  const listEl = document.getElementById("vault-list");
  try {
    const vaults = await api.listVaults();
    if (!vaults || vaults.length === 0) {
      listEl.innerHTML = `<div class="empty">No vaults yet. Create one below.</div>`;
      return;
    }
    listEl.innerHTML = vaults
      .map(
        (v) => `
      <div class="list-item vault-item" data-id="${v.id}">
        <div class="list-item-info">
          <span class="list-item-name">${v.name}</span>
          <span class="list-item-meta">${v.created_at?.slice(0, 10) || ""}</span>
        </div>
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    `
      )
      .join("");

    listEl.querySelectorAll(".vault-item").forEach((el) => {
      el.addEventListener("click", () => {
        navigate("secrets", { vaultId: el.dataset.id, vaultName: el.querySelector(".list-item-name").textContent });
      });
    });
  } catch (err) {
    listEl.innerHTML = `<div class="error">${err.message}</div>`;
  }
}
