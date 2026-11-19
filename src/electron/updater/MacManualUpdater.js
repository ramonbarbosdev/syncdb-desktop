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

    return notifyIfUpdateAvailable(this, notifyIfUpToDate)
      .then((result) => {
        if (!result) {
          return {
            status: "not-available",
            currentVersion: this.getCurrentVersion(),
          };
        }
        if (result.available) {
          return {
            status: "available",
            currentVersion: result.currentVersion,
            latestVersion: result.latestVersion,
          };
        }
        return {
          status: "not-available",
          currentVersion: result.currentVersion,
          latestVersion: result.latestVersion,
        };
      })
      .catch((err) => {
        console.error("[Updater] Erro ao consultar GitHub Releases:", err);
        this.sendToRenderer("update-error", err.message);
        return { status: "error", message: err?.message ?? String(err) };
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
