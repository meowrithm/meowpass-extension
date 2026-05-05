// MeowPass Chrome Extension — Popup Entry Point

import { getToken, getMasterKey } from "./lib/store.js";
import { render as renderLogin } from "./views/login.js";
import { render as renderUnlock } from "./views/unlock.js";
import { render as renderVaults } from "./views/vaults.js";
import { render as renderSecrets } from "./views/secrets.js";
import { render as renderSecretForm } from "./views/secret-form.js";

const app = document.getElementById("app");

const views = {
  login: renderLogin,
  unlock: renderUnlock,
  vaults: renderVaults,
  secrets: renderSecrets,
  "secret-form": renderSecretForm,
};

function navigate(view, params = {}) {
  const renderFn = views[view];
  if (!renderFn) return;
  app.innerHTML = "";
  renderFn(app, navigate, params);
}

// Determine initial view based on stored state
async function init() {
  const token = await getToken();
  if (!token) {
    navigate("login");
    return;
  }

  const masterKey = await getMasterKey();
  if (!masterKey) {
    navigate("unlock");
    return;
  }

  navigate("vaults");
}

init();
