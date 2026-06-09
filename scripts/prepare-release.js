const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const desktopRoot = path.resolve(__dirname, '..');
const configPath = path.resolve(desktopRoot, 'build.config.json');
const packageJsonPath = path.resolve(desktopRoot, 'package.json');

if (!fs.existsSync(configPath)) {
  throw new Error('Arquivo build.config.json nao encontrado.');
}

if (!fs.existsSync(packageJsonPath)) {
  throw new Error('Arquivo package.json nao encontrado.');
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

console.log(`\nPreparando release SyncDB Desktop v${packageJson.version}...`);

const frontRoot = path.resolve(desktopRoot, config.frontPath);
const apiRoot = path.resolve(desktopRoot, config.apiPath);

const electronDist = path.resolve(desktopRoot, 'dist');
const electronBackend = path.resolve(desktopRoot, 'backend');
const electronJar = path.resolve(electronBackend, config.jarName || 'syncdb.jar');

const angularDist = path.resolve(frontRoot, config.angularDistPath || 'dist/browser');
const apiTarget = path.resolve(apiRoot, 'target');

function run(command, cwd) {
  console.log(`\n> ${command}`);

  execSync(command, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
}

function existsOrFail(targetPath, message) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${message}\nCaminho: ${targetPath}`);
  }
}

function clean(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, {
      recursive: true,
      force: true,
    });
  }
}

function copyDir(source, target) {
  fs.cpSync(source, target, {
    recursive: true,
  });
}

function getRunnerPlatform() {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'linux') return 'linux';
  if (process.platform === 'darwin') return 'macos';

  throw new Error(`Sistema operacional nao suportado: ${process.platform}`);
}

function getJavaFileName(platform) {
  return platform === 'windows' ? 'java.exe' : 'java';
}

function isValidJavaExecutable(filePath, platform) {
  const stat = fs.statSync(filePath);

  if (!stat.isFile()) {
    return false;
  }

  if (platform === 'windows') {
    return true;
  }

  return (stat.mode & 0o111) !== 0;
}

function findJavaExecutable(searchRoot, platform) {
  const javaFileName = getJavaFileName(platform);
  const searchedPaths = [];
  const invalidCandidates = [];

  function search(currentPath) {
    searchedPaths.push(currentPath);

    const entries = fs.readdirSync(currentPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const entryPath = path.resolve(currentPath, entry.name);

      if (
        (entry.isFile() || entry.isSymbolicLink()) &&
        entry.name === javaFileName
      ) {
        if (isValidJavaExecutable(entryPath, platform)) {
          return entryPath;
        }

        invalidCandidates.push(entryPath);
      }

      if (entry.isDirectory()) {
        const found = search(entryPath);

        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  const javaExecutable = search(searchRoot);

  if (!javaExecutable) {
    const errorLines = [
      `Executavel Java "${javaFileName}" nao encontrado.`,
      `Pasta base pesquisada: ${searchRoot}`,
      'Caminhos pesquisados:',
      ...searchedPaths.map(item => `- ${item}`),
    ];

    if (invalidCandidates.length > 0) {
      errorLines.push(
        'Candidatos encontrados, mas invalidos:',
        ...invalidCandidates.map(item => `- ${item}`)
      );
    }

    throw new Error(errorLines.join('\n'));
  }

  return javaExecutable;
}

function getJavaRoot(javaExecutable, platform) {
  if (platform === 'macos') {
    const parts = path.normalize(javaExecutable).split(path.sep);
    const contentsIndex = parts.lastIndexOf('Contents');

    if (
      contentsIndex > 0 &&
      parts[contentsIndex + 1] === 'Home' &&
      parts[contentsIndex + 2] === 'bin'
    ) {
      return parts.slice(0, contentsIndex).join(path.sep);
    }
  }

  return path.resolve(javaExecutable, '..', '..');
}

function findJarFile(targetPath) {
  const jars = fs
    .readdirSync(targetPath)
    .filter(file => file.endsWith('.jar'))
    .filter(file => !file.includes('original'))
    .filter(file => !file.includes('sources'))
    .filter(file => !file.includes('javadoc'));

  if (jars.length === 0) {
    throw new Error(`Nenhum JAR encontrado em: ${targetPath}`);
  }

  if (jars.length > 1) {
    console.warn('Mais de um JAR encontrado. Usando o primeiro:');
    console.warn(jars);
  }

  return path.resolve(targetPath, jars[0]);
}

function getNpmInstallCommand(projectRoot) {
  return fs.existsSync(path.resolve(projectRoot, 'package-lock.json'))
    ? 'npm ci'
    : 'npm install';
}

function getMavenCommand(projectRoot) {
  const windowsWrapper = path.resolve(projectRoot, 'mvnw.cmd');
  const unixWrapper = path.resolve(projectRoot, 'mvnw');

  if (process.platform === 'win32' && fs.existsSync(windowsWrapper)) {
    return 'mvnw.cmd clean package -DskipTests';
  }

  if (process.platform !== 'win32' && fs.existsSync(unixWrapper)) {
    return './mvnw clean package -DskipTests';
  }

  return 'mvn clean package -DskipTests';
}

existsOrFail(frontRoot, 'Projeto frontend nao encontrado.');
existsOrFail(apiRoot, 'Projeto API nao encontrado.');

console.log('\nBuildando frontend Angular...');
run(getNpmInstallCommand(frontRoot), frontRoot);
run('npm run build -- --configuration production --base-href ./', frontRoot);

existsOrFail(angularDist, 'Build do Angular nao encontrado.');

console.log('\nLimpando dist do Electron...');
clean(electronDist);

console.log('\nCopiando frontend para o Electron...');
copyDir(angularDist, electronDist);

console.log('\nBuildando API Spring Boot...');
run(getMavenCommand(apiRoot), apiRoot);

existsOrFail(apiTarget, 'Pasta target da API nao encontrada.');

const jarFile = findJarFile(apiTarget);

console.log('\nCopiando JAR para o Electron...');
fs.mkdirSync(electronBackend, { recursive: true });
fs.copyFileSync(jarFile, electronJar);

const platform = getRunnerPlatform();

const platformJresPath = path.resolve(desktopRoot, 'jres', platform);
const targetJre = path.resolve(electronBackend, 'jre');

existsOrFail(
  platformJresPath,
  `Pasta de JREs da plataforma ${platform} nao encontrada.`
);

console.log(`\nProcurando Java em: ${platformJresPath}`);

const sourceJavaExecutable = findJavaExecutable(platformJresPath, platform);
const sourceJre = getJavaRoot(sourceJavaExecutable, platform);

existsOrFail(sourceJavaExecutable, 'Executavel Java encontrado nao existe.');
existsOrFail(sourceJre, 'Pasta raiz da JRE/JDK encontrada nao existe.');

console.log(`Java encontrado em: ${sourceJavaExecutable}`);
console.log(`Raiz da JRE/JDK encontrada: ${sourceJre}`);

console.log('\nCopiando JRE...');
clean(targetJre);
copyDir(sourceJre, targetJre);

const javaExecutable = path.resolve(
  targetJre,
  path.relative(sourceJre, sourceJavaExecutable)
);

existsOrFail(
  javaExecutable,
  'Executavel Java nao encontrado dentro da JRE copiada.'
);

if (platform !== 'windows') {
  fs.chmodSync(javaExecutable, 0o755);
}

console.log('\nRelease preparado com sucesso.');
console.log(`Versao: ${packageJson.version}`);
console.log(`Frontend: ${electronDist}`);
console.log(`Backend: ${electronJar}`);
console.log(`JRE: ${targetJre}`);
