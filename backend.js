const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const treeKill = require("tree-kill");

let backendProcess;

function startBackend(onReadyCallback) {
  const isPackaged = app.isPackaged;
  const jarPath = isPackaged
    ? path.join(process.resourcesPath, "backend", "syncdb.jar")
    : path.join(__dirname, "backend", "syncdb.jar");

  if (!fs.existsSync(jarPath)) {
    console.error(`JAR não encontrado em ${jarPath}`);
    app.quit();
    return;
  }

  const userDataPath = app.getPath("userData");
  const dataDir = path.join(userDataPath, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

  const dbPath = path.join(dataDir, "syncdb.sqlite").replace(/\\/g, "/");

  const basePath = isPackaged
    ? path.join(process.resourcesPath, "backend", "jre")
    : path.join(__dirname, "backend", "jre");

  const java =
    process.platform === "win32"
      ? path.join(basePath, "bin", "java.exe")
      : path.join(basePath, "bin", "java");

  backendProcess = spawn(java, [
    "-jar",
    jarPath,
    "--server.port=8081",
    `--app.db.path=${dbPath}`,
  ]);

  backendProcess.stdout.on("data", (data) => {
    // const msg = data.toString();
    // console.log(`Backend stdout: ${msg}`);
    // if (msg.includes("Started") && msg.includes("Tomcat")) {
    //   onReadyCallback();
    // }
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`Backend finalizado com código: ${code}`);
  });
}

app.on("before-quit", () => {
  if (backendProcess && !backendProcess.killed) {
    treeKill(backendProcess.pid, "SIGTERM", (err) => {
      if (err) console.error("Erro ao encerrar backend:", err);
      else console.log("Backend encerrado com sucesso.");
    });
  }
});

module.exports = { startBackend, backendProcess };
