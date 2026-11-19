const https = require("https");

const GITHUB_LATEST_RELEASE_API =
  "https://api.github.com/repos/ramonbarbosdev/syncdb-desktop/releases/latest";

function fetchLatestRelease() {
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

module.exports = {
  GITHUB_LATEST_RELEASE_API,
  fetchLatestRelease,
};