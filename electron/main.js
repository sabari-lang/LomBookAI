const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const isDev = !app.isPackaged;

let win;
let isRefreshing = false; // Prevent multiple simultaneous refreshes

// Ensure stable folder path so auto-update doesn't reset user data
const appName = isDev ? "lomBookDev" : "lomBook";
app.setPath("userData", path.join(app.getPath("appData"), appName));

function createWindow() {
    win = new BrowserWindow({
        width: 1100,
        height: 750,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#ffffff', // Prevent flash during blur/focus
        show: false, // Don't show until ready
    });

    // Show window when ready to prevent initial flash
    win.once('ready-to-show', () => {
        win.show();
    });

    if (isDev) {
        win.loadURL("http://localhost:5173");
    } else {
        const appPath = app.getAppPath();  // Root of packed app (inside app.asar)
        const indexPath = path.join(appPath, "dist", "index.html");

        log.info("📦 Loading production file:", indexPath);

        const fs = require("fs");
        log.info("File exists:", fs.existsSync(indexPath));

        win.loadFile(indexPath).catch((err) => {
            log.error("❌ Failed to load packaged app:", err);
            win.loadURL(
                "data:text/html," +
                    encodeURIComponent(
                        `<h1>LOM-BOOK Error</h1>
                         <p>Failed to load: ${indexPath}</p>
                         <pre>${err}</pre>`
                    )
            );
        });
    }

    // -----------------------------------
    // AUTO UPDATER (Only Production)
    // -----------------------------------
    autoUpdater.logger = log;
    log.info("🚀 Application started");

    if (!isDev) {
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
            log.error("Auto-update error:", err);
        });
    }

    autoUpdater.on("update-available", () => {
        win?.webContents.send("update-message", "Downloading update...");
    });

    autoUpdater.on("update-downloaded", () => {
        win?.webContents.send("update-message", "Update ready! Restarting...");
        autoUpdater.quitAndInstall();
    });

    autoUpdater.on("error", (err) => {
        win?.webContents.send("update-message", "Update failed: " + err);
    });

    // -----------------------------------
    // IPC: Keyboard / Focus Refresh Fix
    // -----------------------------------
    /**
     * Production-optimized keyboard refresh for Electron
     * Fixes: Frozen input fields when editing forms
     * Method: Ultra-fast blur/focus cycle (5ms = nearly invisible)
     * Debounced: Prevents multiple simultaneous refreshes
     * Fallback: webContents.focus() tried first for zero-blink
     */
    ipcMain.on("refresh-keyboard", () => {
        if (!win || win.isDestroyed()) return;
        
        // Debounce: Prevent rapid successive calls from multiple components
        if (isRefreshing) return;
        isRefreshing = true;

        try {
            // STRATEGY 1: Try webContents focus first (no visible blink)
            const contents = win.webContents;
            if (contents && !contents.isDestroyed()) {
                contents.focus();
            }

            // STRATEGY 2: Ultra-fast window blur/focus (5ms = barely visible)
            win.blur();
            setTimeout(() => {
                if (win && !win.isDestroyed()) {
                    win.focus();
                    
                    // Reset debounce flag after operation completes
                    setTimeout(() => {
                        isRefreshing = false;
                    }, 20);
                } else {
                    isRefreshing = false;
                }
            }, 5); // 5ms = 10x faster than old 50ms, nearly invisible to users
            
        } catch (err) {
            isRefreshing = false;
            log.error("❌ [refresh-keyboard] Error:", err);
        }
    });
}

// -----------------------------------
// Electron Application Lifecycle
// -----------------------------------
app.whenReady().then(createWindow);

app.on("activate", () => {
    // macOS: Re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on("window-all-closed", () => {
    // Quit app when all windows closed (except macOS)
    if (process.platform !== "darwin") {
        app.quit();
    }
});
