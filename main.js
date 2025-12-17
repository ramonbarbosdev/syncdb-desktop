const { app } = require("electron");
const path = require("path");
const treeKill = require("tree-kill");

const { startBackend, backendProcess } = require("./back-end");
const { createWindow, frontendServer } = require("./window");
const { setupAutoUpdater } = require("./updater");

const isDev = !app.isPackaged;

const startUrl = isDev
  ? "http://localhost:4200"
  : `file://${path.join(__dirname, "../dist/index.html")}`;

app.on("ready", () => {
  setupAutoUpdater();


  startBackend(() => {
    createWindow(startUrl);
  });
    createWindow();
});

app.on("before-quit", () => {
  console.log("Aplicação encerrando...");

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
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow(startUrl);
  }
});
