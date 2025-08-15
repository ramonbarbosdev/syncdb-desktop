const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const treeKill = require("tree-kill");

let backendProcess;

function startBackend(createWindowCallback) {
  const isPackaged = app.isPackaged;

  // Caminho do JAR do backend
  const jarPath = isPackaged
    ? path.join(process.resourcesPath, "backend", "syncdb.jar")
    : path.join(__dirname, "backend", "syncdb.jar");

  if (!fs.existsSync(jarPath)) {
    console.error(`Erro: JAR do backend não encontrado em ${jarPath}`);
    app.quit();
    return;
  }

  // Caminho persistente para armazenar SQLite
  const userDataPath = app.getPath("userData");
  const dataDir = path.join(userDataPath, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "syncdb.sqlite").replace(/\\/g, "/");

  // Caminho do Java (Windows usa JRE embutido, Linux usa Java do sistema)
  let javaExecutable;
  if (process.platform === "win32") {
    javaExecutable = path.join(basePath, "bin", "java.exe");
    if (!fs.existsSync(javaExecutable)) {
      console.error("Java não encontrado:", javaExecutable);
      app.quit();
      return;
    }
  } else {
    // Linux: assume que java está no PATH do sistema
    javaExecutable = "java";
    const { execSync } = require("child_process");
    try {
      execSync(`${javaExecutable} -version`, { stdio: "ignore" });
    } catch (err) {
      console.error(
        "Java não encontrado no Linux. Instale com: sudo apt install openjdk-17-jre-headless"
      );
      app.quit();
      return;
    }
  }

  // Inicia o backend
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
      if (createWindowCallback) createWindowCallback();
    }
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

// Encerra o backend ao fechar o app
app.on("before-quit", () => {
  if (backendProcess && !backendProcess.killed) {
    treeKill(backendProcess.pid, "SIGTERM", (err) => {
      if (err) console.error("Erro ao encerrar backend:", err);
      else console.log("Backend encerrado com sucesso.");
    });
  }
});

module.exports = { startBackend, backendProcess };
