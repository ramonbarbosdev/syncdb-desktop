const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const treeKill = require("tree-kill");
const { applyMacDockIcon } = require("./app-icon");

const { startBackend, backendProcess } = require("./back-end");
const { createWindow, getMainWindow, frontendServer } = require("./window");
const { setupTray, destroyTray } = require("./tray");
const { registerNotificationHandlers } = require("./notifications");
const {
  setupAutoUpdater,
  startDownload,
  installUpdate,
  checkForUpdatesManual,
  openLatestRelease,
  schedulePeriodicUpdateChecks,
} = require("./updater");

let isQuitting = false;

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function focusExistingWindow() {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) {
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
}

function setupApplicationMenu() {
  if (process.platform === "darwin") {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: "appMenu" },
        { role: "editMenu" },
      ])
    );
    return;
  }

  Menu.setApplicationMenu(null);
}

function quitApplication() {
  isQuitting = true;
  app.quit();
}

registerNotificationHandlers(ipcMain, { focusWindow: focusExistingWindow });

// IPC para check manual
ipcMain.handle("check-update-manual", () => {
  checkForUpdatesManual();
});

if (hasSingleInstanceLock) {
  app.on("second-instance", () => {
    focusExistingWindow();
  });

  app.whenReady().then(() => {
    applyMacDockIcon();
    setupApplicationMenu();

    const mainWindow = createWindow({
      isQuittingCheck: () => isQuitting,
    });

    setupTray({
      getWindow: getMainWindow,
      quitApp: quitApplication,
    }).catch((err) => console.error("[Tray] Erro ao inicializar:", err));

    setupAutoUpdater(mainWindow);
    schedulePeriodicUpdateChecks();

    startBackend();
  });
}

// IPC do updater
ipcMain.handle("start-update-download", () => {
  startDownload();
});

ipcMain.handle("install-update", () => {
  installUpdate();
});

ipcMain.handle("updater:open-latest-release", () => {
  openLatestRelease();
});

app.on("before-quit", () => {
  isQuitting = true;
  console.log("Aplicação encerrando...");

  destroyTray();

  if (backendProcess && !backendProcess.killed) {
    console.log("Encerrando backend...");
    treeKill(backendProcess.pid, "SIGTERM", (err) => {
      if (err) {
        console.error("Erro ao encerrar backend:", err);
      } else {
        console.log("Backend encerrado com sucesso.");
      }
    });
  }

  if (frontendServer) {
    frontendServer.close(() =>
      console.log("Servidor frontend encerrado.")
    );
  }
});

app.on("window-all-closed", () => {
  if (isQuitting && process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    focusExistingWindow();
    return;
  }

  if (!hasSingleInstanceLock) {
    return;
  }

  if (BrowserWindow.getAllWindows().length === 0) {
    const win = createWindow({
      isQuittingCheck: () => isQuitting,
    });
    setupAutoUpdater(win);
  }
});
