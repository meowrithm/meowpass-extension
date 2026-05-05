import { deriveKey, base64ToBytes, bytesToHex } from "../lib/crypto.js";
import { setMasterKey, getSalt, setSalt } from "../lib/store.js";
import * as api from "../lib/api.js";

export function render(container, navigate) {
  container.innerHTML = `
    <div class="view-header">
      <img src="icons/icon-48.png" class="logo" alt="MeowPass" />
      <h1>Unlock Vault</h1>
      <p class="subtitle">Enter your master password to decrypt secrets.</p>
    </div>
    <form id="unlock-form">
      <label>Master Password</label>
      <input type="password" id="master-password" placeholder="Your master password" required autofocus />
      <div id="error" class="error hidden"></div>
      <button type="submit" id="submit-btn">Unlock</button>
    </form>
  `;

  document.getElementById("unlock-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("error");
    const btn = document.getElementById("submit-btn");
    errEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Deriving key...";

    try {
      const password = document.getElementById("master-password").value;

      // Get salt from local storage or fetch from API
      let saltB64 = await getSalt();
      if (!saltB64) {
        const me = await api.getMe();
        if (me.key_salt) {
          saltB64 = me.key_salt;
          await setSalt(saltB64);
        }
      }

      if (!saltB64) {
        throw new Error("No salt found. Please login via CLI first to set up encryption.");
      }

      const saltBytes = base64ToBytes(saltB64);
      const { key } = await deriveKey(password, saltBytes);

      // Store derived key in session (memory-only, cleared on browser close)
      await setMasterKey(bytesToHex(key));

      navigate("vaults");
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Unlock";
    }
  });
}
