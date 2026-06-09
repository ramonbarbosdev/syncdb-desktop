const { autoUpdater } = require("electron-updater");
const { app, shell } = require("electron");

const RELEASES_URL = "https://github.com/ramonbarbosdev/syncdb-desktop/releases/latest";
const isMac = process.platform === "darwin";

let mainWindowRef = null;
let updateChecked = false;
let updateAvailable = false;
let updaterConfigured = false;

function sendToRenderer(channel, payload) {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) {
    return;
  }

  mainWindowRef.webContents.send(channel, payload);
}

function getUpdatePayload(info = {}) {
  return {
    platform: process.platform,
    mode: isMac ? "manual" : "automatic",
    releasesUrl: RELEASES_URL,
    currentVersion: app.getVersion(),
    version: info.version,
  };
}

function checkForUpdatesManual() {
  if (!app.isPackaged) {
    console.log("Modo DEV: check de atualizacao ignorado");
    return;
  }

  console.log("Check manual de atualizacao solicitado");
  updateChecked = false;
  autoUpdater.checkForUpdates();
}

function setupAutoUpdater(mainWindow) {
  mainWindowRef = mainWindow;

  if (!app.isPackaged) {
    console.log("Modo DEV: auto updater desativado");
    return;
  }

  if (updaterConfigured) {
    return;
  }

  updaterConfigured = true;
  autoUpdater.autoDownload = false;

  autoUpdater.on("update-available", (info) => {
    updateChecked = true;
    updateAvailable = true;

    if (isMac) {
      console.log("Atualizacao disponivel para macOS. Fluxo manual via GitHub Releases.");
    } else {
      console.log("Atualizacao disponivel");
    }

    sendToRenderer("update-available", getUpdatePayload(info));
  });

  autoUpdater.on("update-not-available", () => {
    console.log("Aplicacao ja esta atualizada");
    updateChecked = true;
    updateAvailable = false;
  });

  autoUpdater.on("download-progress", (progress) => {
    if (isMac) {
      return;
    }

    sendToRenderer("update-progress", {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on("update-downloaded", () => {
    if (isMac) {
      return;
    }

    console.log("Atualizacao baixada");
    sendToRenderer("update-downloaded");
  });

  autoUpdater.on("error", (err) => {
    console.error("Erro no updater:", err);
    sendToRenderer("update-error", err.message);
  });

  autoUpdater.checkForUpdates();
}

function startDownload() {
  if (!app.isPackaged) {
    console.log("Modo DEV: download de atualizacao ignorado");
    return;
  }

  if (isMac) {
    console.log("macOS usa atualizacao manual. Abrindo GitHub Releases.");
    openLatestRelease();
    return;
  }

  if (!updateChecked) {
    console.warn("Update ainda nao foi verificado. Aguarde o check.");
    return;
  }

  autoUpdater.downloadUpdate().catch((err) => {
    console.error("Erro ao baixar atualizacao:", err);
    sendToRenderer("update-error", err.message);
  });
}

function installUpdate() {
  if (!app.isPackaged) {
    console.log("Modo DEV: instalacao de atualizacao ignorada");
    return;
  }

  if (isMac) {
    console.log("macOS usa instalacao manual. Abrindo GitHub Releases.");
    openLatestRelease();
    return;
  }

  autoUpdater.quitAndInstall(false, true);
}

function openLatestRelease() {
  if (!updateAvailable) {
    console.log("Abrindo GitHub Releases mesmo sem update confirmado.");
  }

  shell.openExternal(RELEASES_URL).catch((err) => {
    console.error("Erro ao abrir GitHub Releases:", err);
    sendToRenderer("update-error", err.message);
  });
}

module.exports = {
  setupAutoUpdater,
  startDownload,
  installUpdate,
  checkForUpdatesManual,
  openLatestRelease,
};
