const { autoUpdater } = require("electron-updater");

const { ipcMain } = require("electron");


function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    console.log("🔄 Atualização disponívellll.");
    if (mainWindow)   mainWindow.webContents.send("update_available");
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("✅ Atualização baixadaaaaa.");
    autoUpdater.quitAndInstall();
    if (mainWindow)    mainWindow.webContents.send("update_downloaded");
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ Erro no auto-updater:", err);
  });
}

module.exports = { setupAutoUpdater };
