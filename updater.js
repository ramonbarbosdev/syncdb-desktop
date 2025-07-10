const { autoUpdater } = require("electron-updater");

function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    console.log("🔄 Atualização disponível.");
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("✅ Atualização baixada.");
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ Erro no auto-updater:", err);
  });
}

module.exports = { setupAutoUpdater };
