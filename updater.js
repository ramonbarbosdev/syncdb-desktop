const { app, shell } = require("electron");

const { createUpdater } = require("./src/electron/updater/AutoUpdaterFactory");

const updateService = createUpdater({ app, shell });

module.exports = {
  setupAutoUpdater: (mainWindow) => updateService.setup(mainWindow),
  startDownload: () => updateService.startDownload(),
  installUpdate: () => updateService.installUpdate(),
  checkForUpdatesManual: () => updateService.checkForUpdatesManual(),
  openLatestRelease: () => updateService.openLatestRelease(),
};
