const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '..', 'package.json'),
    'utf-8'
  )
);

const version = packageJson.version;
const tag = `v${version}`;

console.log(`\nCriando release ${tag}`);

execSync('git add .', { stdio: 'inherit' });
execSync(`git commit -m "release: ${tag}"`, { stdio: 'inherit' });

try {
  execSync(`git tag ${tag}`, { stdio: 'inherit' });
} catch {
  console.log(`Tag ${tag} já existe.`);
}

execSync('git push', { stdio: 'inherit' });
execSync(`git push origin ${tag}`, { stdio: 'inherit' });

console.log(`\nRelease ${tag} enviada.`);