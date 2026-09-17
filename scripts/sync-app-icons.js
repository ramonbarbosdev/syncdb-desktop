const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

/**
 * Ícones do Electron = mesmo arquivo do favicon web: public/favicon.png
 */
function syncAppIcons(desktopRoot, frontRoot) {
  const publicDir = path.join(frontRoot, 'public');
  const assetsDir = path.join(desktopRoot, 'assets');
  const faviconPng = path.join(publicDir, FAVICON_PNG_NAME);

  if (!fs.existsSync(faviconPng)) {
    throw new Error(`${faviconPng} não encontrado.`);
  }

  fs.mkdirSync(assetsDir, { recursive: true });

  const squarePng = path.join(desktopRoot, '.favicon-square.png');
  execSync(`sips --padToHeightWidth 512 512 "${faviconPng}" --out "${squarePng}"`, {
    stdio: 'inherit',
  });

  const faviconIcoPublic = path.join(publicDir, 'favicon.ico');
  const faviconIcoAssets = path.join(assetsDir, 'icon.ico');

  execSync(`npx --yes png-to-ico "${squarePng}" > "${faviconIcoAssets}"`, {
    cwd: desktopRoot,
    stdio: 'inherit',
    shell: true,
  });
  fs.copyFileSync(faviconIcoAssets, faviconIcoPublic);
  console.log(`ICO gerado a partir de public/${FAVICON_PNG_NAME} (quadrado 512px)`);

  const iconPng = path.join(assetsDir, 'icon.png');
  fs.copyFileSync(squarePng, iconPng);
  console.log('assets/icon.png (512×512, mesma arte do favicon)');

  if (process.platform === 'darwin') {
    const iconsetDir = path.join(desktopRoot, '.icon-sync.iconset');
    const icnsPath = path.join(assetsDir, 'icon.icns');
    const master = path.join(iconsetDir, 'master.png');

    if (fs.existsSync(iconsetDir)) {
      fs.rmSync(iconsetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(iconsetDir, { recursive: true });

    execSync(`sips --padToHeightWidth 1024 1024 "${faviconPng}" --out "${master}"`, {
      stdio: 'inherit',
    });

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
      execSync(`sips -Z ${size} "${master}" --out "${path.join(iconsetDir, name)}"`, {
        stdio: 'pipe',
      });
    }

    execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`, { stdio: 'inherit' });
    fs.rmSync(iconsetDir, { recursive: true, force: true });
    console.log('assets/icon.icns gerado a partir de public/favicon.png');
  } else {
    console.warn('icon.icns não gerado (execute sync:icons no macOS).');
  }

  if (fs.existsSync(squarePng)) {
    fs.unlinkSync(squarePng);
  }
}

if (require.main === module) {
  const desktopRoot = path.resolve(__dirname, '..');
  const frontRoot = resolveFrontRoot(desktopRoot);
  console.log('\nSincronizando ícones a partir de public/favicon.png');
  console.log(`Frontend: ${frontRoot}\n`);
  syncAppIcons(desktopRoot, frontRoot);
  console.log('\nConcluído.\n');
}

module.exports = { syncAppIcons, resolveFrontRoot };
