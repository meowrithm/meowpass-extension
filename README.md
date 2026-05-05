# MeowPass Chrome Extension

E2E encrypted secret management for developers — right in your browser. Same encryption as the CLI, secrets decrypted locally.

## Install

### Download (Recommended)

1. Download `meowpass-extension.zip` from [Releases](https://github.com/meowrithm/meowpass-extension/releases/latest)
2. Unzip it
3. Open `chrome://extensions` and enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the unzipped folder
5. Click the MeowPass icon in the toolbar

### Build from Source

```bash
git clone https://github.com/meowrithm/meowpass-extension.git
cd meowpass-extension
npm install
npm run build
```

Then load `dist/` as an unpacked extension in Chrome.

## Prerequisites

You need a MeowPass account. Install the CLI first:

```bash
brew install chpecson/tap/meowpass
meowpass login
```

## Features

- **Login/Register** — sign in or create an account directly in the extension
- **Master password unlock** — Argon2id key derivation runs in-browser (64MB, 3 iterations)
- **Vault management** — list, create, and delete vaults
- **Secret management** — add, edit, copy to clipboard, and delete secrets
- **E2E encrypted** — AES-256-GCM, byte-compatible with the CLI
- **Zero-knowledge** — your master password and plaintext secrets never leave the browser

## How It Works

```
Master Password → Argon2id (64MB, 3 iterations) → Master Key
Master Key → Decrypts Vault Key (AES-256-GCM)
Vault Key → Encrypts/Decrypts Secrets (AES-256-GCM)
```

All encryption happens locally in the browser using WebCrypto API. The server only stores encrypted ciphertext.

## Screenshots

| Login | Vaults | Secrets |
|-------|--------|---------|
| Sign in or create account | Browse your vaults | Copy, edit, delete secrets |

## Tech Stack

- Vanilla JS (no framework)
- WebCrypto API (AES-256-GCM)
- hash-wasm (Argon2id WASM)
- esbuild (bundler)
- Chrome Manifest V3

## Security

- Master key cached in `chrome.storage.session` (memory-only, cleared on browser close)
- JWT stored in `chrome.storage.local` (not sensitive — secrets are E2E encrypted)
- No data leaves the browser unencrypted
- Same encryption as the MeowPass CLI — secrets are cross-compatible

## Links

- Website: [meowpass.dev](https://meowpass.dev)
- CLI: `brew install chpecson/tap/meowpass`
- MCP Server: [@meowlabs/meowpass-mcp](https://www.npmjs.com/package/@meowlabs/meowpass-mcp)
- Claude Code Skill: [meowrithm/meowpass-skill](https://github.com/meowrithm/meowpass-skill)
- Integrations: [meowpass.dev/integrations](https://meowpass.dev/integrations)
