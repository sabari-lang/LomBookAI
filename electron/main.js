// import { app, BrowserWindow } from "electron";
// import path from "path";
// import { fileURLToPath } from "url";
// import electronIsDev from "electron-is-dev";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"), // updated preload
//       contextIsolation: true,
//     nodeIntegration: false, // security best practice
//     },
//   });

//   if (electronIsDev) {
//     win.loadURL("http://localhost:5174");
//   } else {
//     win.loadFile(path.join(__dirname, "../dist/index.html"));
//   }
// }

// app.whenReady().then(createWindow);

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") app.quit();
// });

// import { app, BrowserWindow, ipcMain } from "electron";
// import path from "path";
// import { fileURLToPath } from "url";
// import electronIsDev from "electron-is-dev";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Unique app name for LOM Finance
// const appName = electronIsDev ? "lomBookDev" : "lombook";

// // ✅ Set userData path to avoid conflicts with other Electron apps
// app.setPath("userData", path.join(app.getPath("appData"), appName));

// let win;

// function createWindow() {
//     win = new BrowserWindow({
//         width: 1000,
//         height: 700,
//         webPreferences: {
//             preload: path.join(__dirname, "preload.js"),
//             contextIsolation: true,
//             nodeIntegration: false, // ✅ Security best practice
//         },
//     });

//     // ✅ Load appropriate URL based on environment
//     if (electronIsDev) {
//         win.loadURL("http://localhost:5173"); // Finance app dev server
//     } else {
//         win.loadFile(path.join(__dirname, "../dist/index.html"));
//     }

//     // ✅ Manual keyboard refresh handler (same as HCM)
//     ipcMain.on("refresh-keyboard", () => {
//         if (win && !win.isDestroyed()) {
//             win.blur();
//             setTimeout(() => {
//                 if (win && !win.isDestroyed()) {
//                     win.focus();
//                 }
//             }, 50);
//         }
//     });
// }

// // ✅ App lifecycle events
// app.whenReady().then(createWindow);

// app.on("window-all-closed", () => {
//     if (process.platform !== "darwin") app.quit();
// });

// app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) createWindow();
// });


const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");
const electronIsDev = require("electron-is-dev");

let win;

// Use a fixed user data folder for stable updates
const appName = electronIsDev ? "lomBookDev" : "lomBook";
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
    });

    if (electronIsDev) {
        win.loadURL("http://localhost:5173");
    } else {

        // 👉 Correct packaged build location
        const prodIndex = path.join(process.resourcesPath, "app", "dist", "index.html");

        log.info("Loading production file:", prodIndex);

        win.loadFile(prodIndex).catch(err => {
            log.error("❌ Failed loading packaged app:", err);
            // Fallback for debugging only
            win.loadFile(path.join(__dirname, "../dist/index.html"));
        });
    }

    // -----------------------
    // AUTO UPDATE (Production Only)
    // -----------------------
    autoUpdater.logger = log;
    log.info("🚀 App Started");

    if (!electronIsDev) {
        autoUpdater.checkForUpdates().catch(err => log.error("Updater Error:", err));
    }

    autoUpdater.on("update-available", () => {
        win.webContents.send("update-message", "Downloading update...");
    });

    autoUpdater.on("update-downloaded", () => {
        win.webContents.send("update-message", "Update downloaded, restarting...");
        autoUpdater.quitAndInstall();
    });

    autoUpdater.on("error", (err) => {
        win.webContents.send("update-message", "Update failed: " + err);
    });

    // -----------------------
    // IPC (Keyboard Refresh Fix)
    // -----------------------
    ipcMain.on("refresh-keyboard", () => {
        if (win) {
            win.blur();
            setTimeout(() => win.focus(), 100);
        }
    });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
