const { Notification } = require("electron");
const { resolveAppIconPath } = require("./app-icon");

function registerNotificationHandlers(ipcMain, { focusWindow }) {
  ipcMain.handle("desktop:show-notification", (_event, payload = {}) => {
    if (!Notification.isSupported()) {
      return { ok: false, reason: "not-supported" };
    }

    const title = String(payload.title || "SyncDB Desktop").trim();
    const body = String(payload.body || "").trim();

    if (!body) {
      return { ok: false, reason: "empty-body" };
    }

    const iconPath = resolveAppIconPath();
    const notification = new Notification({
      title,
      body,
      ...(iconPath ? { icon: iconPath } : {}),
      silent: !!payload.silent,
    });

    notification.on("click", () => {
      if (typeof focusWindow === "function") {
        focusWindow();
      }
    });

    notification.show();
    return { ok: true };
  });
}

module.exports = {
  registerNotificationHandlers,
};
