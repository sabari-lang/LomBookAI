const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expose safe Electron APIs to renderer process
 * Security: contextBridge prevents direct Node.js access from web content
 */
contextBridge.exposeInMainWorld("electronAPI", {
    /**
     * Refresh keyboard input focus (LAST RESORT)
     * Triggers blur/focus cycle to unlock frozen inputs
     * Causes visible blinking - use ensureWindowFocus() first
     */
    refreshKeyboard: () => {
        try {
            ipcRenderer.send("refresh-keyboard");
        } catch (err) {
            // ignore if not running inside Electron
        }
    },

    /**
     * Ensure window has focus (NO BLINK)
     * Uses official Electron focus APIs: show(), focus(), webContents.focus()
     * No blur/focus cycle = no visible blinking
     */
    ensureWindowFocus: () => {
        try {
            ipcRenderer.send("ensure-window-focus");
        } catch (err) {
            // ignore if not running inside Electron
        }
    },

    /**
     * Auto-updater status messages
     * Listens for update download progress and installation notifications
     */
    onUpdateMessage: (callback) => {
        ipcRenderer.on("update-message", (_event, message) => {
            callback(message);
        });
    },

    /**
     * Stability Mode Management
     * Get current stability mode
     */
    getStabilityMode: () => {
        try {
            return ipcRenderer.invoke("get-stability-mode");
        } catch (err) {
            return Promise.resolve({ mode: 'A', config: {} });
        }
    },

    /**
     * Stability Mode Management
     * Set stability mode (requires restart)
     */
    setStabilityMode: (mode) => {
        try {
            return ipcRenderer.invoke("set-stability-mode", mode);
        } catch (err) {
            return Promise.resolve({ success: false, error: err.message });
        }
    },
});
