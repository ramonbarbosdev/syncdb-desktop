const path = require("path");
const fs = require("fs");
const { app, nativeImage } = require("electron");

function resolveAppIconPath() {
  const candidates = [
    path.join(__dirname, "assets", "icon.png"),
    path.join(process.resourcesPath, "assets", "icon.png"),
  ];

  for (const iconPath of candidates) {
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }

  return null;
}

function loadAppIconImage() {
  const iconPath = resolveAppIconPath();
  if (!iconPath) {
    return null;
  }

  const image = nativeImage.createFromPath(iconPath);
  return image.isEmpty() ? null : image;
}

function applyMacDockIcon() {
  if (process.platform !== "darwin" || !app.dock) {
    return;
  }

  const image = loadAppIconImage();
  if (image) {
    app.dock.setIcon(image);
  }
}

module.exports = {
  resolveAppIconPath,
  loadAppIconImage,
  applyMacDockIcon,
};
