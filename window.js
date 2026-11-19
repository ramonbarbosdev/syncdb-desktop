const { BrowserWindow, dialog, app } = require("electron");
const path = require("path");
const { loadAppIconImage } = require("./app-icon");
const http = require("http");
const fs = require("fs");

const { FRONTEND_PORT } = require("./ports");

const FRONTEND_HOST = "127.0.0.1";

let mainWindow;
let frontendServer;
let frontendBaseUrl;

function devToolsShortcutsEnabled() {
  if (!app.isPackaged) {
    return true;
  }
  return process.env.SYNCDB_DEVTOOLS === "1";
}

function toggleDevTools(webContents) {
  if (webContents.isDevToolsOpened()) {
    webContents.closeDevTools();
  } else {
    webContents.openDevTools({ mode: "detach" });
  }
}

function createWindow(options = {}) {
  const { isQuittingCheck } = options;

  const windowIcon = loadAppIconImage();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: process.platform !== "darwin",
    ...(windowIcon ? { icon: windowIcon } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  startFrontendServer((url) => {
    frontendBaseUrl = url;
    mainWindow.loadURL(url);
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (devToolsShortcutsEnabled()) {
      const key = String(input.key || "").toLowerCase();
      const isDevToolsKey =
        input.key === "F12" ||
        ((input.control || input.meta) &&
          input.shift &&
          (key === "i" || key === "d"));

      if (isDevToolsKey) {
        event.preventDefault();
        toggleDevTools(mainWindow.webContents);
        return;
      }
    }

    const isReload =
      (input.control || input.meta) && input.key.toLowerCase() === "r";
    const isF5 = input.key === "F5";

    if (isReload || isF5) {
      event.preventDefault();
      if (frontendBaseUrl) {
        mainWindow.loadURL(frontendBaseUrl);
      }
    }
  });

  mainWindow.on("close", (event) => {
    if (typeof isQuittingCheck === "function" && !isQuittingCheck()) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (frontendServer) {
      frontendServer.close();
      frontendServer = null;
    }
  });

  return mainWindow;
}

function getMainWindow() {
  return mainWindow;
}

function startFrontendServer(callback) {
  const frontendPath = path.join(__dirname, "dist", "browser");

  frontendServer = http.createServer((req, res) => {
    let filePath = path.join(frontendPath, req.url.split("?")[0]);

    if (req.url === "/" || req.url === "") {
      filePath = path.join(frontendPath, "index.html");
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(frontendPath, "index.html");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Erro ao carregar aplicação");
        return;
      }

      res.writeHead(200, {
        "Content-Type": getContentType(filePath),
      });
      res.end(data);
    });
  });

  frontendServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const message =
        `A porta ${FRONTEND_PORT} já está em uso.\n\n` +
        "Feche outra instância do SyncDB Desktop ou libere a porta e abra o app de novo.";
      console.error(`[Frontend] ${message}`);
      dialog.showErrorBox("SyncDB Desktop", message);
      return;
    }
    console.error("[Frontend] Erro no servidor HTTP interno:", err);
    dialog.showErrorBox(
      "SyncDB Desktop",
      `Não foi possível iniciar o servidor do frontend: ${err.message}`
    );
  });

  frontendServer.listen(FRONTEND_PORT, FRONTEND_HOST, () => {
    callback(`http://${FRONTEND_HOST}:${FRONTEND_PORT}`);
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  return (
    {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
    }[ext] || "application/octet-stream"
  );
}

module.exports = {
  createWindow,
  getMainWindow,
  FRONTEND_PORT,
  get frontendServer() {
    return frontendServer;
  },
};
