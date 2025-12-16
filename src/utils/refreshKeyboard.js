/**
 * Keyboard Input Refresh Utility
 * 
 * Purpose: Unlocks frozen keyboard input in Electron when editing forms
 * How it works: Triggers ultra-fast window blur/focus cycle (5ms) via IPC
 * When to use: Called automatically by useUnlockInputs hook on edit mode entry
 * 
 * Production optimized:
 * - Only runs once per edit session (debounced in hook)
 * - Minimal 5ms delay for near-invisible blink
 * - Safe fallback for non-Electron environments (web browser)
 * - Error handling prevents crashes
 */
export const refreshKeyboard = () => {
  try {
    // Check if running inside Electron with IPC bridge
    if (window?.electronAPI?.refreshKeyboard) {
      window.electronAPI.refreshKeyboard();
    }
    // Silently skip if in web browser (development/testing)
  } catch (error) {
    // Non-critical: Log for debugging but don't break app
    if (process.env.NODE_ENV === 'development') {
      console.warn('[refreshKeyboard] Not available:', error.message);
    }
  }
};
