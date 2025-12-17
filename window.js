const { BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

let mainWindow;
let frontendServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  startFrontendServer((url) => {
    mainWindow.loadURL(url);
  });

  // 🔴 INTERCEPTA CTRL+R / CMD+R / F5
  mainWindow.webContents.on("before-input-event", (event, input) => {
    const isReload =
      (input.control || input.meta) &&
      input.key.toLowerCase() === "r";

    const isF5 = input.key === "F5";

    if (isReload || isF5) {
      event.preventDefault();
      mainWindow.loadURL(mainWindow.webContents.getURL().split("/").slice(0, 3).join("/"));
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (frontendServer) frontendServer.close();
  });
}

/**
 * Servidor HTTP interno com fallback SPA
 */
function startFrontendServer(callback) {
  const frontendPath = path.join(__dirname, "dist", "browser", "browser");

  frontendServer = http.createServer((req, res) => {
    let filePath = path.join(frontendPath, req.url);

    // remove query string
    filePath = filePath.split("?")[0];

    // se for raiz
    if (req.url === "/" || req.url === "") {
      filePath = path.join(frontendPath, "index.html");
    }

    // se não existir, cai no index.html (SPA fallback)
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
        "Content-Type": getContentType(filePath)
      });
      res.end(data);
    });
  });

  frontendServer.listen(0, "127.0.0.1", () => {
    const port = frontendServer.address().port;
    callback(`http://localhost:${port}`);
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
      ".ttf": "font/ttf"
    }[ext] || "application/octet-stream"
  );
}

module.exports = { createWindow, frontendServer };
