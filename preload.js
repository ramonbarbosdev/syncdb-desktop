const { contextBridge, ipcRenderer } = require("electron");
const packageJson = require("./package.json");
const {
  BACKEND_PORT,
  backendApiBaseUrl,
  backendWebSocketUrl,
} = require("./ports");

const updateChannelBuffer = new Map();
const UPDATE_CHANNELS = [
  "update-available",
  "manual-update-available",
  "update-not-available",
  "update-progress",
  "update-downloaded",
  "update-error",
  "update-install-failed",
];

for (const channel of UPDATE_CHANNELS) {
  ipcRenderer.on(channel, (_, payload) => {
    updateChannelBuffer.set(channel, payload);
  });
}

function subscribeUpdateChannel(channel, callback) {
  ipcRenderer.on(channel, (_, payload) => callback(payload));
  if (updateChannelBuffer.has(channel)) {
    callback(updateChannelBuffer.get(channel));
  }
}

contextBridge.exposeInMainWorld("platform", process.platform);

contextBridge.exposeInMainWorld("desktop", {
  appVersion: packageJson.version,
  backendPort: BACKEND_PORT,
  apiBaseUrl: backendApiBaseUrl(),
  apiWebSocketUrl: backendWebSocketUrl(),
  showNotification: (payload) =>
    ipcRenderer.invoke("desktop:show-notification", payload),
  openLatestRelease: () => ipcRenderer.invoke("updater:open-latest-release"),
});

contextBridge.exposeInMainWorld("updater", {
  onUpdateAvailable: (cb) => subscribeUpdateChannel("update-available", cb),

  onManualUpdateAvailable: (cb) =>
    subscribeUpdateChannel("manual-update-available", cb),

  onUpdateNotAvailable: (cb) =>
    subscribeUpdateChannel("update-not-available", () => cb()),

  onProgress: (cb) => subscribeUpdateChannel("update-progress", cb),

  onDownloaded: (cb) => subscribeUpdateChannel("update-downloaded", () => cb()),

  onError: (cb) => subscribeUpdateChannel("update-error", cb),

  onInstallFailed: (cb) => subscribeUpdateChannel("update-install-failed", cb),

  startDownload: () => ipcRenderer.invoke("start-update-download"),

  installUpdate: () => ipcRenderer.invoke("install-update"),

  openLatestRelease: () => ipcRenderer.invoke("updater:open-latest-release"),

  checkForUpdates: () => ipcRenderer.invoke("check-update-manual"),

  notifyRendererReady: () => ipcRenderer.invoke("updater:renderer-ready"),
});