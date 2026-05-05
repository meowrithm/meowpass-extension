import * as api from "../lib/api.js";
import { setToken, setSalt } from "../lib/store.js";
import { base64ToBytes, bytesToBase64 } from "../lib/crypto.js";

export function render(container, navigate) {
  let mode = "login";

  function draw() {
    container.innerHTML = `
      <div class="view-header">
        <img src="icons/icon-48.png" class="logo" alt="MeowPass" />
        <h1>MeowPass</h1>
      </div>
      <form id="auth-form">
        ${mode === "register" ? `
          <label>Name</label>
          <input type="text" id="name" placeholder="Your name" required />
        ` : ""}
        <label>Email</label>
        <input type="email" id="email" placeholder="you@example.com" required />
        <label>Password</label>
        <input type="password" id="password" placeholder="${mode === "register" ? "Create a password" : "Your password"}" required />
        <div id="error" class="error hidden"></div>
        <button type="submit" id="submit-btn">
          ${mode === "register" ? "Create Account" : "Sign In"}
        </button>
      </form>
      <p class="toggle-text">
        ${mode === "login"
          ? `Don't have an account? <a href="#" id="toggle-mode">Sign up</a>`
          : `Already have an account? <a href="#" id="toggle-mode">Sign in</a>`
        }
      </p>
    `;

    document.getElementById("toggle-mode").addEventListener("click", (e) => {
      e.preventDefault();
      mode = mode === "login" ? "register" : "login";
      draw();
    });

    document.getElementById("auth-form").addEventListener("submit", handleSubmit);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errEl = document.getElementById("error");
    const btn = document.getElementById("submit-btn");
    errEl.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = mode === "register" ? "Creating..." : "Signing in...";

    try {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      let data;

      if (mode === "register") {
        const name = document.getElementById("name").value;
        data = await api.register(email, name, password);
      } else {
        data = await api.login(email, password);
      }

      await setToken(data.token);

      // Cache salt if available
      if (data.user?.key_salt) {
        await setSalt(data.user.key_salt);
      }

      navigate("unlock");
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = mode === "register" ? "Create Account" : "Sign In";
    }
  }

  draw();
}
