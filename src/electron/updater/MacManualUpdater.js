const { UpdateService } = require("./UpdateService");
const { notifyIfUpdateAvailable } = require("./GithubReleaseNotifier");

class MacManualUpdater extends UpdateService {
  setup(mainWindow) {
    super.setup(mainWindow);
    console.log("[Updater] Inicializando");
    console.log(`[Updater] Plataforma: ${process.platform}`);
    this.scheduleInitialCheck(() => {
      this.checkForUpdatesManual(false);
    });
  }

  checkForUpdatesManual(notifyIfUpToDate = true) {
    console.log("[Updater] Consultando GitHub Releases");

    return notifyIfUpdateAvailable(this, notifyIfUpToDate).catch((err) => {
      console.error("[Updater] Erro ao consultar GitHub Releases:", err);
      this.sendToRenderer("update-error", err.message);
    });
  }

  startDownload() {
    return this.openLatestRelease();
  }

  installUpdate() {
    return this.openLatestRelease();
  }

}

module.exports = {
  MacManualUpdater,
};
