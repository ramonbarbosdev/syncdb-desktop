const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const png2icons = require('png2icons');

const FAVICON_PNG_NAME = 'favicon.png';

function resolveFrontRoot(desktopRoot) {
  const configPath = path.join(desktopRoot, 'build.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('build.config.json não encontrado.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const configured = config.frontPath || '';

  if (/^[A-Za-z]:[\\/]/.test(configured) && process.platform !== 'win32') {
    const macFallback = path.resolve(desktopRoot, '../app-sincdb');
    if (fs.existsSync(macFallback)) {
      return macFallback;
    }
  }

  const resolved = path.isAbsolute(configured)
    ? configured
    : path.resolve(desktopRoot, configured);

  if (fs.existsSync(resolved)) {
    return resolved;
  }

  const sibling = path.resolve(desktopRoot, '../app-sincdb');
  if (fs.existsSync(sibling)) {
    return sibling;
  }

  throw new Error(`Projeto frontend não encontrado: ${configured}`);
}

async function squarePngBuffer(inputPath, size) {
  return sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

function writeIcnsWithIconutil(desktopRoot, sourcePngPath, icnsPath) {
  const iconsetDir = path.join(desktopRoot, '.icon-sync.iconset');
  const master = path.join(iconsetDir, 'master.png');

  if (fs.existsSync(iconsetDir)) {
    fs.rmSync(iconsetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(iconsetDir, { recursive: true });

  execSync(`sips -z 1024 1024 "${sourcePngPath}" --out "${master}"`, { stdio: 'inherit' });

  const sizes = [
    ['icon_16x16.png', 16],
    ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32],
    ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128],
    ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256],
    ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512],
    ['icon_512x512@2x.png', 1024],
  ];

  for (const [name, size] of sizes) {
    execSync(`sips -z ${size} ${size} "${master}" --out "${path.join(iconsetDir, name)}"`, {
      stdio: 'pipe',
    });
  }

  execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'inherit' });
  fs.rmSync(iconsetDir, { recursive: true, force: true });
}

/**
 * Ícones do Electron = public/favicon.png (funciona em macOS, Linux e Windows).
 */
async function syncAppIcons(desktopRoot, frontRoot) {
  const publicDir = path.join(frontRoot, 'public');
  const assetsDir = path.join(desktopRoot, 'assets');
  const faviconPng = path.join(publicDir, FAVICON_PNG_NAME);

  if (!fs.existsSync(faviconPng)) {
    throw new Error(`${faviconPng} não encontrado.`);
  }

  fs.mkdirSync(assetsDir, { recursive: true });

  const square256 = await squarePngBuffer(faviconPng, 256);
  const square1024 = await squarePngBuffer(faviconPng, 1024);

  const faviconIcoPublic = path.join(publicDir, 'favicon.ico');
  const faviconIcoAssets = path.join(assetsDir, 'icon.ico');

  const icoBuffer = png2icons.createICO(square256, png2icons.BILINEAR, 0, true, true);
  if (!icoBuffer || icoBuffer.length === 0) {
    throw new Error('Falha ao gerar icon.ico (formato Windows/NSIS)');
  }
  fs.writeFileSync(faviconIcoAssets, icoBuffer);
  fs.copyFileSync(faviconIcoAssets, faviconIcoPublic);
  console.log(
    `ICO gerado (${icoBuffer.length} bytes) a partir de public/${FAVICON_PNG_NAME}`
  );

  const iconPng = path.join(assetsDir, 'icon.png');
  fs.writeFileSync(iconPng, square1024);
  console.log('assets/icon.png (1024×1024) — usado pelo electron-builder no macOS');

  const icnsPath = path.join(assetsDir, 'icon.icns');
  if (process.platform === 'darwin') {
    writeIcnsWithIconutil(desktopRoot, iconPng, icnsPath);
    console.log('assets/icon.icns gerado com iconutil (formato nativo macOS)');
  } else {
    const icnsBuffer = png2icons.createICNS(square1024, png2icons.BILINEAR, 0);
    if (!icnsBuffer || icnsBuffer.length === 0) {
      throw new Error('Falha ao gerar icon.icns a partir de favicon.png');
    }
    fs.writeFileSync(icnsPath, icnsBuffer);
    console.log('assets/icon.icns gerado com png2icons (fallback fora do macOS)');
  }
}

async function main() {
  const desktopRoot = path.resolve(__dirname, '..');
  const frontRoot = resolveFrontRoot(desktopRoot);
  console.log('\nSincronizando ícones a partir de public/favicon.png');
  console.log(`Frontend: ${frontRoot}\n`);
  await syncAppIcons(desktopRoot, frontRoot);
  console.log('\nConcluído.\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { syncAppIcons, resolveFrontRoot };
