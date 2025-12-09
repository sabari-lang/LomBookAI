// // src/utils/refreshKeyboard.js

// export const refreshKeyboard = () => {
//   try {
//     if (window?.electronAPI?.refreshKeyboard) {
//       window.electronAPI.refreshKeyboard();
//     }
//   } catch (e) {
//     // Ignore when not in Electron or any error
//   }
// };
// src/utils/refreshKeyboard.js

let lastCall = 0;
const THROTTLE_DELAY = 300;

export const refreshKeyboard = () => {
  const now = Date.now();

  if (now - lastCall < THROTTLE_DELAY) return;
  lastCall = now;

  try {
    if (window?.electronAPI?.refreshKeyboard) {
      window.electronAPI.refreshKeyboard();
    }
  } catch (e) {
    // ignore if outside electron
  }
};
