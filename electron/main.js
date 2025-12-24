const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const isDev = !app.isPackaged;

let win;

// -----------------------------------
// Stability Mode Configuration (Compatibility Profiles)
// -----------------------------------
// Load stability mode BEFORE app ready (required for switches)
const stabilityModeConfig = require('./stabilityModeConfig');
const stabilityMode = stabilityModeConfig.getStabilityMode();
const stabilityConfig = stabilityModeConfig.getStabilityModeConfig(stabilityMode);

// Configure logging (Windows: enable file logging if not already configured)
if (process.platform === 'win32' && !process.argv.includes('--enable-logging')) {
    // electron-log already configured, but ensure file logging is enabled
    // electron-log defaults to file logging on Windows
}

// Determine config source for logging
let configSource = 'default';
if (stabilityModeConfig.readStabilityMode()) {
    configSource = 'userData file';
} else if (process.env.LOM_STABILITY_MODE) {
    configSource = 'environment variable (LOM_STABILITY_MODE)';
} else if (process.argv.some(arg => arg.includes('--stability-mode'))) {
    configSource = 'command line argument (--stability-mode)';
}

// Log stability mode at startup
log.info('🔧 Stability Mode Active:', {
    mode: stabilityMode,
    config: stabilityConfig,
    source: configSource,
    platform: process.platform,
    isDev: isDev,
});

// -----------------------------------
// Apply Stability Mode Switches (BEFORE app.whenReady())
// -----------------------------------

// Mode A (default): disable-renderer-backgrounding
if (stabilityConfig.disableRendererBackgrounding) {
    app.commandLine.appendSwitch('disable-renderer-backgrounding');
    log.info('✅ Applied: disable-renderer-backgrounding (Mode A)');
}

// Mode B: Windows occlusion mitigation
if (stabilityConfig.disableWinOcclusion && process.platform === 'win32') {
    app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
    log.info('✅ Applied: disable-features=CalculateNativeWinOcclusion (Mode B, Windows only)');
}

// Mode C: Disable hardware acceleration
if (stabilityConfig.disableHardwareAcceleration) {
    app.disableHardwareAcceleration();
    log.info('✅ Applied: disableHardwareAcceleration() (Mode C)');
}

// Log which switches were applied
log.info('📊 Stability Mode Switches Applied:', {
    mode: stabilityMode,
    disableRendererBackgrounding: stabilityConfig.disableRendererBackgrounding,
    disableWinOcclusion: stabilityConfig.disableWinOcclusion,
    disableHardwareAcceleration: stabilityConfig.disableHardwareAcceleration,
});

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
            // Stability Mode: Prevent background throttling
            // When false, renderer continues running at full speed even when window is backgrounded
            backgroundThrottling: stabilityConfig.backgroundThrottling,
        },
        backgroundColor: '#ffffff', // Prevent flash during blur/focus
        show: false, // Don't show until ready
    });

    // Log webPreferences configuration (official Electron feature)
    log.info('📊 BrowserWindow webPreferences (Stability Mode):', {
        mode: stabilityMode,
        backgroundThrottling: stabilityConfig.backgroundThrottling ? 'enabled (throttling ON)' : 'disabled (throttling OFF)',
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
    // IPC: Keyboard / Focus Refresh Fix (LAST RESORT)
    // -----------------------------------
    // Existing IPC channel: blur/focus cycle (causes visible blink)
    // Keep unchanged as last resort fallback
    ipcMain.on("refresh-keyboard", () => {
        if (win && !win.isDestroyed()) {
            win.blur();
            setTimeout(() => {
                if (win && !win.isDestroyed()) {
                    win.focus();
                }
            }, 50);
        }
    });

    // -----------------------------------
    // IPC: Stability Mode Management
    // -----------------------------------
    // Get current stability mode
    ipcMain.handle("get-stability-mode", () => {
        const currentMode = stabilityModeConfig.getStabilityMode();
        return {
            mode: currentMode,
            config: stabilityModeConfig.getStabilityModeConfig(currentMode),
        };
    });

    // Set stability mode (persists to config file, requires restart)
    ipcMain.handle("set-stability-mode", (event, mode) => {
        try {
            if (!Object.values(stabilityModeConfig.STABILITY_MODES).includes(mode)) {
                return { success: false, error: 'Invalid mode' };
            }

            const success = stabilityModeConfig.writeStabilityMode(mode);
            if (success) {
                log.info('📝 Stability mode changed:', { mode, requiresRestart: true });
            }
            return { success, requiresRestart: true };
        } catch (e) {
            log.error('Failed to set stability mode:', e);
            return { success: false, error: e.message };
        }
    });

    // -----------------------------------
    // IPC: Ensure Window Focus (NO BLINK)
    // -----------------------------------
    // Official Electron focus APIs: show(), focus(), webContents.focus()
    // No blur/focus cycle = no visible blinking
    ipcMain.on("ensure-window-focus", () => {
        if (win && !win.isDestroyed()) {
            // Show window if hidden
            if (!win.isVisible()) {
                win.show();
            }

            // Official Electron focus APIs (no blink)
            win.focus();
            win.webContents.focus();

            // Log focus status (when logging enabled via renderer flag)
            // Official Electron API: win.isFocused() for diagnostics
            const isFocused = win.isFocused();
            log.info('🔧 ensure-window-focus called (Official Electron Focus APIs)', {
                isFocused: isFocused, // win.isFocused() - confirms OS focus acquired
                isVisible: win.isVisible(),
                platform: process.platform,
            });

            // Optional: Windows-only always-on-top toggle (aggressive, behind flag)
            // Only use if window still not focused after 50ms
            // Keep existing flag system for this feature (separate from stability mode)
            const useAlwaysOnTopForFocus = process.argv.includes('--use-always-on-top-focus') ||
                                          process.env.USE_ALWAYS_ON_TOP_FOCUS === 'true' ||
                                          false;
            if (useAlwaysOnTopForFocus && process.platform === 'win32') {
                setTimeout(() => {
                    if (win && !win.isDestroyed() && !win.isFocused()) {
                        log.info('⚠️ Window still not focused after 50ms, using always-on-top toggle (Windows)');
                        win.setAlwaysOnTop(true);
                        setTimeout(() => {
                            if (win && !win.isDestroyed()) {
                                win.setAlwaysOnTop(false);
                            }
                        }, 100);
                    }
                }, 50);
            }
        }
    });
}

// -----------------------------------
// GPU Info Logging (after app ready)
// -----------------------------------
app.on('gpu-info-update', () => {
    app.getGPUInfo('basic').then((gpuInfo) => {
        log.info('📊 GPU Info (Basic):', {
            vendorId: gpuInfo.auxAttributes?.vendorId || 'N/A',
            deviceId: gpuInfo.auxAttributes?.deviceId || 'N/A',
            vendorString: gpuInfo.auxAttributes?.vendorString || 'N/A',
            driverVersion: gpuInfo.auxAttributes?.driverVersion || 'N/A',
        });
    }).catch((err) => {
        log.error('Failed to get GPU info:', err);
    });
});

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
