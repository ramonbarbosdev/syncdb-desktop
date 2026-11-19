const { RELEASES_URL } = require("./UpdateService");
const { fetchLatestRelease } = require("./GithubLatestRelease");
const { isNewerVersion, normalizeVersion } = require("./VersionComparator");

async function notifyIfUpdateAvailable(service, notifyIfUpToDate) {
  const release = await fetchLatestRelease();
  const currentVersion = normalizeVersion(service.getCurrentVersion());
  const latestVersion = normalizeVersion(release.tag_name);
  const releaseUrl = release.html_url || RELEASES_URL;

  console.log(`[Updater] Versão atual: ${currentVersion}`);
  console.log(`[Updater] Última versão (GitHub): ${latestVersion}`);

  if (!latestVersion || !isNewerVersion(currentVersion, latestVersion)) {
    service.updateAvailable = false;
    console.log("[Updater] Aplicação já está atualizada (GitHub)");
    if (notifyIfUpToDate) {
      service.sendToRenderer("update-not-available");
    }
    return { available: false, currentVersion, latestVersion };
  }

  service.updateAvailable = true;
  service.updateChecked = true;
  console.log("[Updater] Atualização disponível (GitHub)");

  const payload = {
    currentVersion,
    latestVersion,
    version: latestVersion,
    availableVersion: latestVersion,
    releaseUrl,
    platform: process.platform,
    mode: "github-release",
  };

  service.sendToRenderer("manual-update-available", payload);
  service.sendToRenderer("update-available", payload);

  return { available: true, currentVersion, latestVersion };
}

module.exports = {
  notifyIfUpdateAvailable,
};