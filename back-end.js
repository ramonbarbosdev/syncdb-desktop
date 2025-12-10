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
    console.error(`Erro: JAR do backend não encontrado em ${jarPath}`);
    app.quit();
    return;
  }

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
    "--server.port=8081"
  ]);

  backendProcess.stdout.on("data", (data) => {
    const text = data.toString();
    console.log(`Backend stdout: ${text}`);
    if (text.includes("Started") && text.includes("Tomcat")) {
      // backend pronto: carregar a janela
       console.log("Backend iniciado com sucesso!");
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

app.on("before-quit", () => {
  if (backendProcess && !backendProcess.killed) {
    treeKill(backendProcess.pid, "SIGTERM", (err) => {
      if (err) console.error("Erro ao encerrar backend:", err);
      else console.log("Backend encerrado com sucesso.");
    });
  }
});

module.exports = { startBackend, backendProcess };
