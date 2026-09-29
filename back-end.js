const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const net = require("net");
const { app, dialog } = require("electron");
const treeKill = require("tree-kill");
const { BACKEND_PORT } = require("./ports");

let backendProcess;
let backendStartPromise = null;

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once("error", (err) => {
      resolve(err.code === "EADDRINUSE");
    });

    tester.once("listening", () => {
      tester.close(() => resolve(false));
    });

    tester.listen(port, "127.0.0.1");
  });
}

function showBackendError(title, message) {
  console.error(`[Backend] ${title}: ${message}`);
  dialog.showErrorBox(title, message);
}

function getBackendPaths() {
  const isPackaged = app.isPackaged;

  const jarPath = isPackaged
    ? path.join(process.resourcesPath, "backend", "syncdb.jar")
    : path.join(__dirname, "backend", "syncdb.jar");

  const jrePath = isPackaged
    ? path.join(process.resourcesPath, "backend", "jre")
    : path.join(__dirname, "backend", "jre");

  const javaExecutable =
    process.platform === "win32"
      ? path.join(jrePath, "bin", "java.exe")
      : process.platform === "darwin"
        ? path.join(jrePath, "Contents", "Home", "bin", "java")
        : path.join(jrePath, "bin", "java");

  return { jarPath, javaExecutable };
}

function startBackend(onReadyCallback) {
  if (backendProcess && backendProcess.exitCode === null && !backendProcess.killed) {
    console.log("[Backend] Processo Java já em execução nesta instância.");
    if (typeof onReadyCallback === "function") {
      onReadyCallback();
    }
    return backendStartPromise;
  }

  if (backendStartPromise) {
    return backendStartPromise;
  }

  backendStartPromise = (async () => {
    const { jarPath, javaExecutable } = getBackendPaths();

    if (!fs.existsSync(jarPath)) {
      showBackendError(
        "SyncDB Desktop",
        `Backend não encontrado:\n${jarPath}\n\nReinstale o aplicativo.`
      );
      app.quit();
      return false;
    }

    if (!fs.existsSync(javaExecutable)) {
      showBackendError(
        "SyncDB Desktop",
        `Java embutido não encontrado:\n${javaExecutable}\n\nReinstale o aplicativo.`
      );
      app.quit();
      return false;
    }

    if (await isPortInUse(BACKEND_PORT)) {
      showBackendError(
        "SyncDB Desktop — servidor local",
        `A porta ${BACKEND_PORT} já está em uso.\n\n` +
          "Feche outra instância do SyncDB Desktop (ícone na bandeja → Sair) " +
          "ou reinicie o computador.\n\n" +
          "A API do desktop usa a porta " +
          `${BACKEND_PORT} (não confundir com 8081 do desenvolvimento).`
      );
      return false;
    }

    backendProcess = spawn(javaExecutable, [
      "-jar",
      jarPath,
      `--server.port=${BACKEND_PORT}`,
    ]);

    let started = false;
    let stderrBuffer = "";

    backendProcess.stdout.on("data", (data) => {
      const text = data.toString();
      console.log(`[Backend stdout] ${text}`);
      if (!started && text.includes("Started") && text.includes("Tomcat")) {
        started = true;
        console.log(`[Backend] Iniciado em http://127.0.0.1:${BACKEND_PORT}/sincdb`);
        if (typeof onReadyCallback === "function") {
          onReadyCallback();
        }
      }
    });

    backendProcess.stderr.on("data", (data) => {
      const text = data.toString();
      stderrBuffer += text;
      console.error(`[Backend stderr] ${text}`);
    });

    backendProcess.on("close", (code) => {
      console.log(`[Backend] Processo encerrado (código ${code})`);
      backendProcess = null;
      backendStartPromise = null;

      if (!started && code !== 0 && code !== null) {
        const hint = stderrBuffer.trim().slice(-1200) || "Sem detalhes no log.";
        showBackendError(
          "SyncDB Desktop — servidor local",
          `O backend não conseguiu iniciar (código ${code}).\n\n${hint}`
        );
      }
    });

    return true;
  })();

  return backendStartPromise;
}

app.on("before-quit", () => {
  if (backendProcess && !backendProcess.killed) {
    treeKill(backendProcess.pid, "SIGTERM", (err) => {
      if (err) console.error("Erro ao encerrar backend:", err);
      else console.log("Backend encerrado com sucesso.");
    });
  }
});

function getBackendProcess() {
  return backendProcess;
}

module.exports = { startBackend, getBackendProcess, BACKEND_PORT };
