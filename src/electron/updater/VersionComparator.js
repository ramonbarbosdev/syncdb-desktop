function normalizeVersion(version) {
  return String(version || "")
    .trim()
    .replace(/^v/i, "")
    .split("-")[0];
}

function parseVersion(version) {
  return normalizeVersion(version)
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isNaN(part) ? 0 : part));
}

function compareVersions(currentVersion, latestVersion) {
  const current = parseVersion(currentVersion);
  const latest = parseVersion(latestVersion);
  const length = Math.max(current.length, latest.length);

  for (let index = 0; index < length; index += 1) {
    const currentPart = current[index] || 0;
    const latestPart = latest[index] || 0;

    if (latestPart > currentPart) {
      return 1;
    }

    if (latestPart < currentPart) {
      return -1;
    }
  }

  return 0;
}

function isNewerVersion(currentVersion, latestVersion) {
  return compareVersions(currentVersion, latestVersion) > 0;
}

module.exports = {
  compareVersions,
  isNewerVersion,
  normalizeVersion,
};
