const { Tray, Menu, nativeImage, app } = require("electron");
const path = require("path");
const fs = require("fs");

let tray = null;

function getTrayIconFileName() {
  if (process.platform === "win32") {
    return "icon.ico";
  }
  if (process.platform === "darwin") {
    return "icon.icns";
  }
  return "icon.png";
}

function getTrayIconCandidates() {
  const fileName = getTrayIconFileName();
  const candidates = [
    path.join(__dirname, "assets", fileName),
    path.join(process.resourcesPath, "assets", fileName),
  ];

  if (app.isPackaged) {
    candidates.push(
      path.join(path.dirname(process.execPath), "resources", "assets", fileName)
    );
  }

  return candidates;
}

function resolveTrayIconPath() {
  for (const iconPath of getTrayIconCandidates()) {
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }
  return null;
}

function loadTrayIconFromFile(iconPath) {
  const image = nativeImage.createFromPath(iconPath);
  if (image.isEmpty()) {
    return null;
  }

  if (process.platform === "win32") {
    return image.resize({ width: 16, height: 16 });
  }

  if (process.platform === "linux") {
    return image.resize({ width: 22, height: 22 });
  }

  return image;
}

async function loadTrayIcon() {
  const iconPath = resolveTrayIconPath();
  if (iconPath) {
    const image = loadTrayIconFromFile(iconPath);
    if (image && !image.isEmpty()) {
      return image;
    }
    console.warn("[Tray] Arquivo de ícone inválido:", iconPath);
  } else {
    console.warn(
      "[Tray] Ícone não encontrado. Caminhos testados:",
      getTrayIconCandidates().join(", ")
    );
  }

  try {
    const exeIcon = await app.getFileIcon(process.execPath, { size: "small" });
    if (!exeIcon.isEmpty()) {
      return exeIcon;
    }
  } catch (err) {
    console.warn("[Tray] Falha ao carregar ícone do executável:", err);
  }

  return nativeImage.createEmpty();
}

function showMainWindow(getWindow) {
  const win = getWindow();
  if (!win || win.isDestroyed()) {
    return;
  }
  win.show();
  win.focus();
}

async function setupTray({ getWindow, quitApp }) {
  if (tray) {
    return tray;
  }

  const icon = await loadTrayIcon();
  if (icon.isEmpty()) {
    console.error(
      "[Tray] Nenhum ícone disponível; o ícone na bandeja pode ficar invisível."
    );
  }

  tray = new Tray(icon);
  tray.setToolTip("SyncDB Desktop — fechar a janela mantém o app na bandeja");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir SyncDB",
      click: () => showMainWindow(getWindow),
    },
    { type: "separator" },
    {
      label: "Sair",
      click: quitApp,
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => showMainWindow(getWindow));

  return tray;
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = {
  setupTray,
  destroyTray,
};
