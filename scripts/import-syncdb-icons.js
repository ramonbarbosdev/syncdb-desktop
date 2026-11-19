/**
 * Importa o pacote oficial SyncDB (zip ou pasta extraída).
 * Cada subpasta tem formato próprio — nada é gerado/misturado entre plataformas.
 *
 * Uso:
 *   npm run import:icons
 *   npm run import:icons -- "C:/Users/Ramon/Downloads/syncdb-icons.zip"
 *   npm run import:icons -- --web-only
 *   npm run import:icons -- --desktop-only
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const png2icons = require('png2icons');
const { resolveFrontRoot, writeIcnsWithIconutil } = require('./sync-app-icons');

const DEFAULT_ZIP = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  'Downloads',
  'syncdb-icons.zip'
);

function parseArgs(argv) {
  const flags = { web: true, desktop: true, logo: true };
  const paths = [];
  for (const arg of argv.slice(2)) {
    if (arg === '--web-only') {
      flags.desktop = false;
      flags.logo = false;
    } else if (arg === '--desktop-only') {
      flags.web = false;
      flags.logo = false;
    } else if (arg === '--no-logo') {
      flags.logo = false;
    } else if (!arg.startsWith('--')) {
      paths.push(arg);
    }
  }
  return { flags, sourcePath: paths[0] };
}

function extractZip(zipPath, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  if (process.platform === 'win32') {
    const escapedZip = zipPath.replace(/'/g, "''");
    const escapedDir = targetDir.replace(/'/g, "''");
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedDir}' -Force"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, { stdio: 'inherit' });
  }
}

function findPackRoot(baseDir) {
  if (fs.existsSync(path.join(baseDir, 'web', 'favicon.svg'))) {
    return baseDir;
  }
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const nested = path.join(baseDir, entry.name);
    if (fs.existsSync(path.join(nested, 'web', 'favicon.svg'))) {
      return nested;
    }
  }
  throw new Error(`Pacote inválido: pasta web/ não encontrada em ${baseDir}`);
}

function resolvePackDir(sourceArg) {
  const source = path.resolve(sourceArg || DEFAULT_ZIP);
  if (!fs.existsSync(source)) {
    throw new Error(`Arquivo não encontrado: ${source}`);
  }

  if (source.toLowerCase().endsWith('.zip')) {
    const cacheDir = path.join(path.resolve(__dirname, '..'), '.syncdb-icons-cache');
    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.mkdirSync(cacheDir, { recursive: true });
    extractZip(source, cacheDir);
    return findPackRoot(cacheDir);
  }

  if (fs.statSync(source).isDirectory()) {
    return findPackRoot(source);
  }

  throw new Error(`Use um .zip ou uma pasta extraída: ${source}`);
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`${path.basename(from)} → ${to}`);
}

function importWeb(packRoot, publicDir) {
  console.log('\n── Web → app-sincdb/public');
  const webDir = path.join(packRoot, 'web');
  const map = [
    'favicon.svg',
    'favicon.ico',
    'favicon-16.png',
    'favicon-32.png',
    'favicon-48.png',
    'favicon-64.png',
    'icon-180.png',
    'icon-192.png',
    'icon-512.png',
  ];
  for (const name of map) {
    const from = path.join(webDir, name);
    if (!fs.existsSync(from)) {
      console.warn(`  (ausente) web/${name}`);
      continue;
    }
    copyFile(from, path.join(publicDir, name));
  }

  const manifest = {
    name: 'SyncDB',
    short_name: 'SyncDB',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    theme_color: '#2B55FF',
    background_color: '#16161a',
    display: 'standalone',
  };
  fs.writeFileSync(
    path.join(publicDir, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('site.webmanifest (gerado a partir de web/icon-192 e icon-512)');
}

function importLogo(packRoot, publicDir) {
  console.log('\n── Logo → app-sincdb/public');
  const logoDir = path.join(packRoot, 'logo');
  if (fs.existsSync(path.join(logoDir, 'syncdb-logo-transparent.svg'))) {
    copyFile(
      path.join(logoDir, 'syncdb-logo-transparent.svg'),
      path.join(publicDir, 'syncdb-logo.svg')
    );
  }
  const logoPng = path.join(logoDir, 'syncdb-logo-transparent-512.png');
  if (fs.existsSync(logoPng)) {
    copyFile(logoPng, path.join(publicDir, 'logo.png'));
    copyFile(logoPng, path.join(publicDir, 'logo-light.png'));
  }
}

function writeIcnsFromPng(desktopRoot, png1024, icnsPath) {
  if (process.platform === 'darwin') {
    writeIcnsWithIconutil(desktopRoot, png1024, icnsPath);
    return;
  }
  const png = fs.readFileSync(png1024);
  const icnsBuffer = png2icons.createICNS(png, png2icons.BILINEAR, 0);
  if (!icnsBuffer?.length) {
    throw new Error('Falha ao gerar icon.icns');
  }
  fs.writeFileSync(icnsPath, icnsBuffer);
}

function importDesktop(packRoot, desktopRoot) {
  console.log('\n── Desktop → syncdb-desktop/assets');
  const assetsDir = path.join(desktopRoot, 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });

  const winIco = path.join(packRoot, 'windows', 'syncdb.ico');
  if (!fs.existsSync(winIco)) {
    throw new Error('windows/syncdb.ico ausente no pacote');
  }
  copyFile(winIco, path.join(assetsDir, 'icon.ico'));

  const macPng = path.join(packRoot, 'ios', 'icon-1024.png');
  if (!fs.existsSync(macPng)) {
    throw new Error('ios/icon-1024.png ausente no pacote');
  }
  copyFile(macPng, path.join(assetsDir, 'icon.png'));

  const linux512 = path.join(packRoot, 'linux', 'syncdb-512.png');
  if (fs.existsSync(linux512)) {
    copyFile(linux512, path.join(assetsDir, 'linux-512.png'));
  }

  const icnsPath = path.join(assetsDir, 'icon.icns');
  writeIcnsFromPng(desktopRoot, macPng, icnsPath);
  console.log(`icon.icns → ${icnsPath}`);
}

function main() {
  const { flags, sourcePath } = parseArgs(process.argv);
  const packRoot = resolvePackDir(sourcePath);
  const desktopRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(resolveFrontRoot(desktopRoot), 'public');

  console.log(`\nPacote: ${packRoot}\n`);

  if (flags.web) {
    importWeb(packRoot, publicDir);
  }
  if (flags.logo) {
    importLogo(packRoot, publicDir);
  }
  if (flags.desktop) {
    importDesktop(packRoot, desktopRoot);
  }

  console.log('\nConcluído. Web e desktop usam arquivos nativos de cada pasta do pacote.\n');
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

module.exports = { main, resolvePackDir, importWeb, importDesktop };