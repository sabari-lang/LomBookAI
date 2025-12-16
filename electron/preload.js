const { contextBridge, ipcRenderer } = require("electron");

/**
 * Expose safe Electron APIs to renderer process
 * Security: contextBridge prevents direct Node.js access from web content
 */
contextBridge.exposeInMainWorld("electronAPI", {
    /**
     * Refresh keyboard input focus (production-optimized)
     * Triggers minimal-blink blur/focus cycle to unlock frozen inputs
     * Called once per edit session via useUnlockInputs hook
     */
    refreshKeyboard: () => {
        try {
            ipcRenderer.send("refresh-keyboard");
        } catch (err) {
            console.error("[Electron] refreshKeyboard failed:", err);
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
    }
});
