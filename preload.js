const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("updater", {
 
    

  onUpdateAvailable: (cb) =>
    ipcRenderer.on("update-available", cb),

  onProgress: (cb) =>
    ipcRenderer.on("update-progress", (_, data) => cb(data)),

  onDownloaded: (cb) =>
    ipcRenderer.on("update-downloaded", cb),

  onError: (cb) =>
    ipcRenderer.on("update-error", (_, message) => cb(message)),

  // ações
  startDownload: () =>
    ipcRenderer.invoke("start-update-download"),

  installUpdate: () =>
    ipcRenderer.invoke("install-update"),

  openLatestRelease: () =>
    ipcRenderer.invoke("updater:open-latest-release"),

  // 🔍 NOVO — check manual
  checkForUpdates: () =>
    ipcRenderer.invoke("check-update-manual")
});
