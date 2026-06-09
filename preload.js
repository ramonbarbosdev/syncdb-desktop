const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("updater", {
  onUpdateAvailable: (cb) =>
    ipcRenderer.on("update-available", (_, data) => cb(data)),

  onManualUpdateAvailable: (cb) =>
    ipcRenderer.on("manual-update-available", (_, data) => cb(data)),

  onProgress: (cb) =>
    ipcRenderer.on("update-progress", (_, data) => cb(data)),

  onDownloaded: (cb) =>
    ipcRenderer.on("update-downloaded", cb),

  onError: (cb) =>
    ipcRenderer.on("update-error", (_, message) => cb(message)),

  // ações
  startDownload: () =>
    ipcRenderer.invoke("start-update-download"),

  installUpdate: () =>
    ipcRenderer.invoke("install-update"),

  openLatestRelease: () =>
    ipcRenderer.invoke("updater:open-latest-release"),

  // 🔍 NOVO — check manual
  checkForUpdates: () =>
    ipcRenderer.invoke("check-update-manual")
});

function createUpdateAvailableDialog(payload) {
  const existingDialog = document.getElementById("syncdb-manual-update-dialog");

  if (existingDialog) {
    existingDialog.remove();
  }

  const currentVersion = payload?.currentVersion || "-";
  const latestVersion = payload?.latestVersion || "-";

  const overlay = document.createElement("div");
  overlay.id = "syncdb-manual-update-dialog";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "syncdb-manual-update-title");
  overlay.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:2147483647",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:24px",
    "background:rgba(15,23,42,.48)",
    "font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
  ].join(";");

  const dialog = document.createElement("section");
  dialog.style.cssText = [
    "width:min(440px,100%)",
    "border-radius:8px",
    "background:#fff",
    "color:#111827",
    "box-shadow:0 24px 70px rgba(15,23,42,.26)",
    "padding:24px",
    "line-height:1.45"
  ].join(";");

  const title = document.createElement("h2");
  title.id = "syncdb-manual-update-title";
  title.textContent = "Nova versão disponível";
  title.style.cssText = "margin:0 0 12px;font-size:20px;font-weight:700";

  const message = document.createElement("p");
  message.textContent =
    "Você está utilizando a versão atual do SyncDB Desktop. Encontramos uma nova versão disponível para download.";
  message.style.cssText = "margin:0 0 18px;font-size:14px;color:#374151";

  const versions = document.createElement("div");
  versions.style.cssText = [
    "display:grid",
    "gap:8px",
    "margin:0 0 16px",
    "padding:12px",
    "border:1px solid #e5e7eb",
    "border-radius:8px",
    "background:#f9fafb",
    "font-size:14px"
  ].join(";");
  const currentVersionRow = document.createElement("div");
  const currentVersionLabel = document.createElement("strong");
  currentVersionLabel.textContent = "Versão atual:";
  currentVersionRow.append(currentVersionLabel, ` ${currentVersion}`);

  const latestVersionRow = document.createElement("div");
  const latestVersionLabel = document.createElement("strong");
  latestVersionLabel.textContent = "Nova versão:";
  latestVersionRow.append(latestVersionLabel, ` ${latestVersion}`);

  versions.append(currentVersionRow, latestVersionRow);

  const note = document.createElement("p");
  note.textContent = "No macOS a atualização é realizada manualmente.";
  note.style.cssText = "margin:0 0 22px;font-size:13px;color:#4b5563";

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Agora Não";
  closeButton.style.cssText = [
    "border:1px solid #d1d5db",
    "border-radius:6px",
    "background:#fff",
    "color:#111827",
    "padding:10px 14px",
    "font-size:14px",
    "cursor:pointer"
  ].join(";");
  closeButton.addEventListener("click", () => overlay.remove());

  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.textContent = "Baixar Atualização";
  downloadButton.style.cssText = [
    "border:1px solid #0f766e",
    "border-radius:6px",
    "background:#0f766e",
    "color:#fff",
    "padding:10px 14px",
    "font-size:14px",
    "font-weight:600",
    "cursor:pointer"
  ].join(";");
  downloadButton.addEventListener("click", () => {
    ipcRenderer.invoke("updater:open-latest-release");
    overlay.remove();
  });

  actions.append(closeButton, downloadButton);
  dialog.append(title, message, versions, note, actions);
  overlay.append(dialog);
  document.body.append(overlay);
  downloadButton.focus();
}

ipcRenderer.on("manual-update-available", (_, payload) => {
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => createUpdateAvailableDialog(payload),
      { once: true }
    );
    return;
  }

  createUpdateAvailableDialog(payload);
});
