const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const treeKill = require("tree-kill");
const { autoUpdater } = require("electron-updater");

let mainWindow;
let backendProcess;
let frontendServer;

function startBackend() {
  const isPackaged = app.isPackaged;

  const jarPath = isPackaged
    ? path.join(process.resourcesPath, "backend", "syncdb.jar")
    : path.join(__dirname, "backend", "syncdb.jar");

  if (!fs.existsSync(jarPath)) {
    console.error(`Erro: JAR do backend não encontrado em ${jarPath}`);
    app.quit();
    return;
  }

  // 🔐 Caminho persistente e seguro para armazenar o SQLite
  const userDataPath = app.getPath("userData");
  console.log("Caminho da pasta userData:", userDataPath);
  const dataDir = path.join(userDataPath, "data");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "syncdb.sqlite").replace(/\\/g, "/");

  const basePath = isPackaged
    ? path.join(process.resourcesPath, "backend", "jre")
    : path.join(__dirname, "backend", "jre");

  const javaExecutable =
    process.platform === "win32"
      ? path.join(basePath, "bin", "java.exe")
      : path.join(basePath, "bin", "java");


  if (!fs.existsSync(javaExecutable)) {
    console.error("Java não encontrado:", javaExecutable);
    app.quit();
    return;
  }

  backendProcess = spawn(javaExecutable, [
    "-jar",
    jarPath,
    "--server.port=8081",
    `--app.db.path=${dbPath}`,
  ]);

  backendProcess.stdout.on("data", (data) => {
    const text = data.toString();
    console.log(`Backend stdout: ${text}`);
    if (text.includes("Started") && text.includes("Tomcat")) {
      // Backend pronto: carregar a janela
      createWindow();
    }
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createFrontendServer(callback) {
  const frontendPath = path.join(__dirname, "dist", "browser", "browser");
  if (!fs.existsSync(frontendPath)) {
    console.error(
      `Erro: Pasta do frontend Angular não encontrada em ${frontendPath}`
    );
    app.quit();
    return;
  }

  frontendServer = http.createServer((req, res) => {
    const filePath = path.join(
      frontendPath,
      req.url === "/" ? "index.html" : req.url
    );
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      } else {
        res.writeHead(200, { "Content-Type": getContentType(filePath) });
        res.end(data);
      }
    });
  });

  frontendServer.listen(0, "127.0.0.1", () => {
    const port = frontendServer.address().port;
    console.log(
      `Servidor frontend Electron iniciado em: http://localhost:${port}`
    );
    callback(`http://localhost:${port}`);
  });
}

function getContentType(filePath) {
  const extname = path.extname(filePath);
  switch (extname) {
    case ".html":
      return "text/html";
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
      return "image/jpg";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    default:
      return "application/octet-stream";
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  createFrontendServer((url) => {
    mainWindow.loadURL(url);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (frontendServer) {
      frontendServer.close(() => console.log("Servidor frontend encerrado."));
    }
  });
}

app.on("ready", () => {
  autoUpdater.checkForUpdatesAndNotify();
  startBackend();
  createWindow();
});

autoUpdater.on("update-available", () => {
  console.log("🔄 Atualização disponível.");
});

autoUpdater.on("update-downloaded", () => {
  console.log("✅ Atualização baixada. Instalando...");
  autoUpdater.quitAndInstall();
});

autoUpdater.on("error", (err) => {
  console.error("❌ Erro ao verificar atualização:", err);
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
    frontendServer.close(() => console.log("Servidor frontend encerrado."));
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
