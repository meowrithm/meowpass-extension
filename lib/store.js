// chrome.storage helpers

export async function getLocal(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

export async function setLocal(key, value) {
  await chrome.storage.local.set({ [key]: value });
}

export async function removeLocal(key) {
  await chrome.storage.local.remove(key);
}

export async function getSession(key) {
  const result = await chrome.storage.session.get(key);
  return result[key] ?? null;
}

export async function setSession(key, value) {
  await chrome.storage.session.set({ [key]: value });
}

export async function removeSession(key) {
  await chrome.storage.session.remove(key);
}

// Token
export const getToken = () => getLocal("jwt_token");
export const setToken = (t) => setLocal("jwt_token", t);
export const clearToken = () => removeLocal("jwt_token");

// Salt (base64)
export const getSalt = () => getLocal("key_salt");
export const setSalt = (s) => setLocal("key_salt", s);

// Master key (hex, session-only — cleared on browser close)
export const getMasterKey = () => getSession("master_key");
export const setMasterKey = (k) => setSession("master_key", k);
export const clearMasterKey = () => removeSession("master_key");

// Clear all
export async function clearAll() {
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
}
