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
      contextIsolation: true,
    },
  });

  startFrontendServer((url) => {
    mainWindow.loadURL(url);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (frontendServer) frontendServer.close();
  });
}

function startFrontendServer(callback) {
  const frontendPath = path.join(__dirname, "dist", "browser", "browser");

  frontendServer = http.createServer((req, res) => {
    const filePath = path.join(
      frontendPath,
      req.url === "/" ? "index.html" : req.url
    );
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
      } else {
        res.writeHead(200, { "Content-Type": getContentType(filePath) });
        res.end(data);
      }
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
      ".ttf": "font/ttf",
    }[ext] || "application/octet-stream"
  );
}

module.exports = { createWindow, frontendServer };
