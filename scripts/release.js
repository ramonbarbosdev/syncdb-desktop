const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
}

function output(command) {
  return execSync(command, { encoding: "utf-8" }).trim();
}

const packageJson = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "..", "package.json"),
    "utf-8"
  )
);

const version = packageJson.version;
const tag = `v${version}`;

function platformsFromMessage(message) {
  const matches = message.match(/\[(win|mac|linux)\]/gi) || [];
  return [
    ...new Set(
      matches.map((token) => token.replace(/^\[|\]$/g, "").toLowerCase())
    ),
  ];
}

const platformArgs = process.argv
  .slice(2)
  .map((value) => value.replace(/^\[|\]$/g, "").toLowerCase())
  .filter((value) => ["win", "mac", "linux"].includes(value));

let releasePlatforms = [...new Set(platformArgs)];
if (releasePlatforms.length === 0) {
  const lastMessage = output("git log -1 --format=%B");
  releasePlatforms = platformsFromMessage(lastMessage);
}

const platformSuffix =
  releasePlatforms.length > 0
    ? ` ${releasePlatforms.map((platform) => `[${platform}]`).join(" ")}`
    : "";

console.log(`\nCriando release ${tag}`);
if (releasePlatforms.length > 0) {
  console.log(`Plataformas: ${releasePlatforms.join(", ")}`);
}

try {
  output(`git rev-parse ${tag}`);
  throw new Error(`Tag ${tag} ja existe. Atualize a versao antes de publicar.`);
} catch (err) {
  if (!String(err.message).includes("ja existe")) {
    // Tag nao existe, segue o fluxo.
  } else {
    throw err;
  }
}

run("git add package.json package-lock.json");

const hasStagedChanges = (() => {
  try {
    execSync("git diff --cached --quiet", { stdio: "ignore" });
    return false;
  } catch {
    return true;
  }
})();

if (hasStagedChanges) {
  run(`git commit -m "release: ${tag}${platformSuffix}"`);
} else {
  console.log("Nenhuma mudanca de versao para commitar.");
}

run(`git tag ${tag}`);
run("git push");
run(`git push origin ${tag}`);

console.log(`\nRelease ${tag} enviada.`);
