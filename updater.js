const { autoUpdater } = require("electron-updater");
const { app } = require("electron");

let mainWindowRef = null;
let updateChecked = false;


// setTimeout(() => {
//   mainWindowRef.webContents.send("update-available");
// }, 3000);

// setTimeout(() => {
//   mainWindowRef.webContents.send("update-progress", { percent: 45 });
// }, 6000);

// setTimeout(() => {
//   mainWindowRef.webContents.send("update-downloaded");
// }, 9000);


function checkForUpdatesManual() {
  if (!app.isPackaged) {
    console.log("🧪 Modo DEV: check de atualização ignorado");
    return;
  }

  console.log("🔍 Check manual de atualização solicitado");
  updateChecked = false;
  autoUpdater.checkForUpdates();
}

function setupAutoUpdater(mainWindow) {
  mainWindowRef = mainWindow;

  // IMPORTANTE: não baixar automaticamente
  autoUpdater.autoDownload = false;

  // Check silencioso ao iniciar
  autoUpdater.checkForUpdates();


  autoUpdater.on("update-available", () => {
    console.log("🔄 Atualização disponível");
    updateChecked = true; // ✅ marca que o check foi feito
    mainWindowRef.webContents.send("update-available");
  });

  autoUpdater.on("update-not-available", () => {
    console.log("✔ Aplicação já está atualizada");
    updateChecked = true; // ✅ check concluído
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindowRef.webContents.send("update-progress", {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total
    });
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("✅ Atualização baixada");
    mainWindowRef.webContents.send("update-downloaded");
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ Erro no updater:", err);
    mainWindowRef.webContents.send("update-error", err.message);
  });
}

function startDownload() {
  if (!updateChecked) {
    console.warn("⏳ Update ainda não foi verificado. Aguarde o check.");
    return;
  }

  autoUpdater.downloadUpdate().catch((err) => {
    console.error("❌ Erro ao baixar atualização:", err);
    if (mainWindowRef) {
      mainWindowRef.webContents.send("update-error", err.message);
    }
  });
}

function installUpdate() {
  autoUpdater.quitAndInstall();
}

module.exports = {
  setupAutoUpdater,
  startDownload,
  installUpdate,
  checkForUpdatesManual
};
