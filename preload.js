const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("platform", process.platform);

contextBridge.exposeInMainWorld("desktop", {
  showNotification: (payload) =>
    ipcRenderer.invoke("desktop:show-notification", payload),
});

contextBridge.exposeInMainWorld("updater", {
  onUpdateAvailable: (cb) =>
    ipcRenderer.on("update-available", (_, data) => cb(data)),

  onManualUpdateAvailable: (cb) =>
    ipcRenderer.on("manual-update-available", (_, data) => cb(data)),

  onUpdateNotAvailable: (cb) =>
    ipcRenderer.on("update-not-available", () => cb()),

  onProgress: (cb) =>
    ipcRenderer.on("update-progress", (_, data) => cb(data)),

  onDownloaded: (cb) =>
    ipcRenderer.on("update-downloaded", cb),

  onError: (cb) =>
    ipcRenderer.on("update-error", (_, message) => cb(message)),

  onInstallFailed: (cb) =>
    ipcRenderer.on("update-install-failed", (_, data) => cb(data)),

  startDownload: () => ipcRenderer.invoke("start-update-download"),

  installUpdate: () => ipcRenderer.invoke("install-update"),

  openLatestRelease: () => ipcRenderer.invoke("updater:open-latest-release"),

  checkForUpdates: () => ipcRenderer.invoke("check-update-manual"),
});
