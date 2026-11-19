const path = require("path");
const { app, BrowserWindow } = require("electron");

app.whenReady().then(async () => {
  const preloadPath = path.resolve(__dirname, "..", "preload.js");
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: preloadPath,
    },
  });

  win.webContents.on("preload-error", (_event, preloadFile, error) => {
    console.error("preload-error", preloadFile, error);
  });

  win.webContents.on("console-message", (_event, _level, message, line, sourceId) => {
    console.log("renderer-console:", message, sourceId, line);
  });

  await win.loadURL("http://127.0.0.1:47832/");

  const probe = await win.webContents.executeJavaScript(`
    JSON.stringify({
      platform: typeof window.platform,
      platformValue: window.platform,
      desktop: typeof window.desktop,
      updater: typeof window.updater,
      syncdbPreloadReady: window.syncdbPreloadReady,
      checkFn: typeof (window.updater && window.updater.checkForUpdates),
      ua: navigator.userAgent
    })
  `);

  console.log(probe);
  app.quit();
});