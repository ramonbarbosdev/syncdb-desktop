const { RELEASES_URL, UpdateService } = require("./UpdateService");
const { MacManualUpdater } = require("./MacManualUpdater");

class ElectronAutoUpdaterService extends UpdateService {
  constructor(dependencies) {
    super(dependencies);
    const { autoUpdater } = require("electron-updater");

    this.autoUpdater = autoUpdater;
    this.updaterConfigured = false;
    this.updateChecked = false;
  }

  setup(mainWindow) {
    super.setup(mainWindow);
    console.log("[Updater] Inicializando");
    console.log(`[Updater] Plataforma: ${process.platform}`);

    if (!this.app.isPackaged) {
      console.log("[Updater] Modo DEV: auto updater desativado");
      return;
    }

    if (this.updaterConfigured) {
      return;
    }

    this.updaterConfigured = true;
    this.autoUpdater.autoDownload = true;
    this.autoUpdater.autoInstallOnAppQuit = true;

    this.autoUpdater.on("update-available", (info) => {
      this.updateChecked = true;
      this.updateAvailable = true;
      console.log("[Updater] Atualização disponível");

      this.sendToRenderer("update-available", {
        platform: process.platform,
        mode: "automatic",
        releasesUrl: RELEASES_URL,
        currentVersion: this.getCurrentVersion(),
        version: info.version,
      });
    });

    this.autoUpdater.on("update-not-available", () => {
      console.log("[Updater] Aplicação já está atualizada");
      this.updateChecked = true;
      this.updateAvailable = false;
    });

    this.autoUpdater.on("download-progress", (progress) => {
      this.sendToRenderer("update-progress", {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    this.autoUpdater.on("update-downloaded", () => {
      console.log("[Updater] Atualização baixada");
      this.sendToRenderer("update-downloaded");
    });

    this.autoUpdater.on("error", (err) => {
      console.error("[Updater] Erro no updater:", err);
      this.sendToRenderer("update-error", err.message);
    });

    this.autoUpdater.checkForUpdatesAndNotify();
  }

  checkForUpdatesManual() {
    if (!this.app.isPackaged) {
      console.log("[Updater] Modo DEV: check de atualização ignorado");
      return undefined;
    }

    console.log("[Updater] Check manual de atualização solicitado");
    this.updateChecked = false;
    return this.autoUpdater.checkForUpdatesAndNotify();
  }

  startDownload() {
    if (!this.app.isPackaged) {
      console.log("[Updater] Modo DEV: download de atualização ignorado");
      return undefined;
    }

    if (!this.updateChecked) {
      console.warn("[Updater] Update ainda não foi verificado. Aguarde o check.");
      return undefined;
    }

    return this.autoUpdater.downloadUpdate().catch((err) => {
      console.error("[Updater] Erro ao baixar atualização:", err);
      this.sendToRenderer("update-error", err.message);
    });
  }

  installUpdate() {
    if (!this.app.isPackaged) {
      console.log("[Updater] Modo DEV: instalação de atualização ignorada");
      return undefined;
    }

    return this.autoUpdater.quitAndInstall(false, true);
  }
}

function createUpdater(dependencies) {
  if (process.platform === "darwin") {
    return new MacManualUpdater(dependencies);
  }

  return new ElectronAutoUpdaterService(dependencies);
}

module.exports = {
  createUpdater,
};
