const RELEASES_URL =
  "https://github.com/ramonbarbosdev/syncdb-desktop/releases/latest";

class UpdateService {
  constructor({ app, shell }) {
    this.app = app;
    this.shell = shell;
    this.mainWindow = null;
    this.updateAvailable = false;
  }

  setup(mainWindow) {
    this.mainWindow = mainWindow;
    this.runInitialUpdateCheck = null;
  }

  markRendererReady() {
    if (typeof this.runInitialUpdateCheck !== "function") {
      return;
    }

    setTimeout(this.runInitialUpdateCheck, 400);
  }

  scheduleInitialCheck(runCheck) {
    let executed = false;
    const runOnce = () => {
      if (executed) {
        return;
      }
      executed = true;
      runCheck();
    };

    this.runInitialUpdateCheck = runOnce;

    if (!this.mainWindow?.webContents) {
      runOnce();
      return;
    }

    const webContents = this.mainWindow.webContents;
    const fallback = () => setTimeout(runOnce, 12000);

    if (webContents.isLoading()) {
      webContents.once("did-finish-load", fallback);
      return;
    }

    fallback();
  }

  sendToRenderer(channel, payload) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    this.mainWindow.webContents.send(channel, payload);
  }

  getCurrentVersion() {
    return this.app.getVersion();
  }

  openLatestRelease() {
    if (!this.updateAvailable) {
      console.log("[Updater] Abrindo GitHub Releases mesmo sem update confirmado");
    }

    console.log("[Updater] Abrindo página de download");
    return this.shell.openExternal(RELEASES_URL).catch((err) => {
      console.error("[Updater] Erro ao abrir GitHub Releases:", err);
      this.sendToRenderer("update-error", err.message);
    });
  }
}

module.exports = {
  RELEASES_URL,
  UpdateService,
};
