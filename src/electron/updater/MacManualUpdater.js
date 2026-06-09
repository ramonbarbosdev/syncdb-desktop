const https = require("https");

const { RELEASES_URL, UpdateService } = require("./UpdateService");
const { isNewerVersion, normalizeVersion } = require("./VersionComparator");

const GITHUB_LATEST_RELEASE_API =
  "https://api.github.com/repos/ramonbarbosdev/syncdb-desktop/releases/latest";

class MacManualUpdater extends UpdateService {
  setup(mainWindow) {
    super.setup(mainWindow);
    console.log("[Updater] Inicializando");
    console.log(`[Updater] Plataforma: ${process.platform}`);
    this.checkForUpdatesManual();
  }

  checkForUpdatesManual() {
    console.log("[Updater] Consultando GitHub Releases");

    return this.fetchLatestRelease()
      .then((release) => {
        const currentVersion = normalizeVersion(this.getCurrentVersion());
        const latestVersion = normalizeVersion(release.tag_name);
        const releaseUrl = release.html_url || RELEASES_URL;

        console.log(`[Updater] Versão atual: ${currentVersion}`);
        console.log(`[Updater] Última versão: ${latestVersion}`);

        if (!latestVersion || !isNewerVersion(currentVersion, latestVersion)) {
          this.updateAvailable = false;
          console.log("[Updater] Aplicação já está atualizada");
          return;
        }

        this.updateAvailable = true;
        console.log("[Updater] Atualização disponível");

        this.sendToRenderer("manual-update-available", {
          currentVersion,
          latestVersion,
          releaseUrl,
        });
      })
      .catch((err) => {
        console.error("[Updater] Erro ao consultar GitHub Releases:", err);
        this.sendToRenderer("update-error", err.message);
      });
  }

  startDownload() {
    return this.openLatestRelease();
  }

  installUpdate() {
    return this.openLatestRelease();
  }

  fetchLatestRelease() {
    return new Promise((resolve, reject) => {
      const request = https.get(
        GITHUB_LATEST_RELEASE_API,
        {
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "syncdb-desktop-updater",
          },
        },
        (response) => {
          let body = "";

          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            body += chunk;
          });

          response.on("end", () => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
              reject(
                new Error(
                  `GitHub Releases respondeu com status ${response.statusCode}`
                )
              );
              return;
            }

            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      request.setTimeout(15000, () => {
        request.destroy(new Error("Timeout ao consultar GitHub Releases"));
      });

      request.on("error", reject);
    });
  }
}

module.exports = {
  GITHUB_LATEST_RELEASE_API,
  MacManualUpdater,
};
