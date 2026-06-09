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

console.log(`\nCriando release ${tag}`);

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
  run(`git commit -m "release: ${tag}"`);
} else {
  console.log("Nenhuma mudanca de versao para commitar.");
}

run(`git tag ${tag}`);
run("git push");
run(`git push origin ${tag}`);

console.log(`\nRelease ${tag} enviada.`);
