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

import { app, BrowserWindow, ipcMain } from "electron";
const { autoUpdater } = require("electron-updater");
import path from "path";
import { fileURLToPath } from "url";
import electronIsDev from "electron-is-dev";
const log = require("electron-log");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Unique app name for LOM Finance
const appName = electronIsDev ? "lomBookDev" : "lombook";

// ✅ Set userData path to avoid conflicts with other Electron apps
app.setPath("userData", path.join(app.getPath("appData"), appName));

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false, // ✅ Security best practice
        },
    });

    // ✅ Load appropriate URL based on environment
    if (electronIsDev) {
        win.loadURL("http://localhost:5173"); // Finance app dev server
    } else {
        win.loadFile(path.join(__dirname, "../dist/index.html"));
    }

    // ✅ Manual keyboard refresh handler (same as HCM)
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
}

// ✅ App lifecycle events
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
