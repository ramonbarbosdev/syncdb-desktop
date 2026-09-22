const CHECK_INTERVAL_MS = 8 * 60 * 60 * 1000;

let intervalStarted = false;
let intervalId = null;

function scheduleUpdateChecks(app, checkForUpdates) {
  if (!app.isPackaged || intervalStarted) {
    return;
  }

  intervalStarted = true;

  intervalId = setInterval(() => {
    try {
      checkForUpdates();
    } catch (err) {
      console.error("[Updater] Erro na checagem periodica:", err);
    }
  }, CHECK_INTERVAL_MS);

  if (typeof intervalId.unref === "function") {
    intervalId.unref();
  }
}

function clearScheduledUpdateChecks() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  intervalStarted = false;
}

module.exports = {
  CHECK_INTERVAL_MS,
  scheduleUpdateChecks,
  clearScheduledUpdateChecks,
};
