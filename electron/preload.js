// const { contextBridge, ipcRenderer } = require("electron");

// contextBridge.exposeInMainWorld("electronAPI", {
//     refreshKeyboard: () => ipcRenderer.send("refresh-keyboard"),
// });


const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    refreshKeyboard: () => ipcRenderer.send("refresh-keyboard"),

    onUpdateMessage: (callback) => {
        ipcRenderer.on("update-message", (_event, message) => {
            callback(message);
        });
    }
});
