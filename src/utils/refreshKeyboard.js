/**
 * Refresh keyboard input focus
 * 
 * Emergency fallback: calls Electron IPC to refresh window focus (blur/focus cycle)
 * Causes visible blinking - should only be used as manual fallback if keyboard input freezes
 * 
 * Auto-refresh is disabled by default. Use manual trigger in Settings if needed.
 * 
 * @param {Object} options
 * @param {HTMLElement} options.targetElement - Optional element to focus after refresh
 * @param {boolean} options.force - If true, bypass feature flag check (for manual triggers)
 */
export const refreshKeyboard = async (options = {}) => {
  const { force = false } = options;
  
  // Check feature flag unless forced (manual trigger)
  if (!force) {
    try {
      // Dynamic import to check feature flag (config is already evaluated)
      const { keyboardConfig } = await import('../config/keyboardConfig');
      if (!keyboardConfig.enableAutoRefresh) {
        // Auto-refresh disabled - only allow manual triggers
        return;
      }
    } catch (e) {
      // If config can't be loaded, default to disabled
      return;
    }
  }

  try {
    // Simple IPC call to refresh window focus (blur/focus cycle)
    if (window?.electronAPI?.refreshKeyboard) {
      window.electronAPI.refreshKeyboard();
      
      // If target element provided, focus it after a short delay
      if (options?.targetElement) {
        setTimeout(() => {
          if (options.targetElement && typeof options.targetElement.focus === 'function') {
            options.targetElement.focus();
          }
        }, 100);
      }
    }
  } catch (e) {
    // Ignore if not running inside Electron
    console.warn('refreshKeyboard failed:', e);
  }
};
