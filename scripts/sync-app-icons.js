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

  const square512 = await squarePngBuffer(faviconPng, 512);
  const square1024 = await squarePngBuffer(faviconPng, 1024);

  const faviconIcoPublic = path.join(publicDir, 'favicon.ico');
  const faviconIcoAssets = path.join(assetsDir, 'icon.ico');

  const pngToIco = (await import('png-to-ico')).default;
  const icoBuffer = await pngToIco([square512]);
  fs.writeFileSync(faviconIcoAssets, icoBuffer);
  fs.copyFileSync(faviconIcoAssets, faviconIcoPublic);
  console.log(`ICO gerado a partir de public/${FAVICON_PNG_NAME} (quadrado 512px)`);

  const iconPng = path.join(assetsDir, 'icon.png');
  fs.writeFileSync(iconPng, square512);
  console.log('assets/icon.png (512×512)');

  const icnsPath = path.join(assetsDir, 'icon.icns');
  const icnsBuffer = png2icons.createICNS(square1024, png2icons.BILINEAR, 0);
  if (!icnsBuffer || icnsBuffer.length === 0) {
    throw new Error('Falha ao gerar icon.icns a partir de favicon.png');
  }
  fs.writeFileSync(icnsPath, icnsBuffer);
  console.log('assets/icon.icns gerado a partir de public/favicon.png');
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
