// MeowPass Service Worker — minimal, handles extension lifecycle
// Master key is stored in chrome.storage.session (memory-only, MV3)

chrome.runtime.onInstalled.addListener(() => {
  console.log("MeowPass extension installed.");
});
