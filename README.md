# SyncDB Desktop

Aplicação desktop multiplataforma construída com Electron, Angular e Spring Boot.

O SyncDB Desktop distribui em um único instalador:

* Frontend Angular
* Backend Spring Boot
* JRE embarcada
* Atualizações automáticas
* Instalação sem dependências externas

O usuário não precisa instalar Java, Node.js ou qualquer outro runtime para utilizar o sistema.

---

# Arquitetura

O projeto é composto por três repositórios independentes:

```text
app-sincdb
├── Frontend Angular

api-sincdb
├── Backend Spring Boot

syncdb-desktop
├── Aplicação Electron
├── Empacotamento
├── Atualizações
└── Distribuição
```

Durante o processo de release:

```text
Angular
    ↓
Build

Spring Boot
    ↓
Build

Electron
    ↓
Empacota Front + API + JRE

Electron Builder
    ↓
Gera Instalador

GitHub Releases
    ↓
Distribui Atualizações
```

---

# Funcionamento

Ao iniciar o aplicativo:

```text
Electron
    ↓
Inicializa JRE embarcada
    ↓
Executa Spring Boot
    ↓
Carrega Frontend Angular
    ↓
Verifica atualizações
```

O backend é executado localmente em uma porta interna.

O frontend é servido pelo próprio Electron.

---

# Estrutura do Projeto

```text
syncdb-desktop/
├── assets/
├── backend/
│   ├── syncdb.jar
│   └── jre/
├── dist/
├── docs/
├── scripts/
│   ├── prepare-release.js
│   └── release.js
├── jres/
│   ├── windows/
│   ├── linux/
│   └── macos/
├── .github/
│   └── workflows/
├── main.js
├── back-end.js
├── updater.js
├── preload.js
├── window.js
├── build.config.json
└── package.json
```

---

# Requisitos para Desenvolvimento

* Node.js 22+
* Java 21+
* Maven
* Git

---

# Configuração Local

Arquivo:

```text
build.config.json
```

Exemplo:

```json
{
  "frontPath": "C:/Users/Ramon/Documents/dev/Angular/app-sincdb",
  "apiPath": "C:/Users/Ramon/Documents/dev/Java/api-sincdb",
  "angularDistPath": "dist/browser",
  "jarName": "syncdb.jar"
}
```

Esse arquivo é utilizado apenas para builds locais.

---

# Desenvolvimento

Executa o Electron em modo desenvolvimento:

```bash
npm start
```

---

# Build Local

## Preparar Release

Compila Angular, Spring Boot e prepara os artefatos necessários para o Electron.

Comando:

```bash
npm run prepare:release
```

Esse processo executa automaticamente:

```text
✓ Build Angular
✓ Build Spring Boot
✓ Copia Frontend
✓ Copia JAR
✓ Copia JRE
✓ Prepara Electron
```

Resultado:

```text
dist/
backend/syncdb.jar
backend/jre/
```

Nenhum instalador é gerado.

Nenhuma publicação é realizada.

---

# Gerar Instaladores

## Windows

```bash
npm run release:win
```

## Linux

```bash
npm run release:linux
```

## macOS

```bash
npm run release:mac
```

Resultado:

```text
release/
├── Setup.exe
├── AppImage
└── DMG
```

Nenhuma publicação é realizada.

---

# Versionamento

## Patch

Incrementa:

```text
1.0.0 → 1.0.1
```

Comando:

```bash
npm run version:patch
```

---

## Minor

Incrementa:

```text
1.0.0 → 1.1.0
```

Comando:

```bash
npm run version:minor
```

---

## Major

Incrementa:

```text
1.0.0 → 2.0.0
```

Comando:

```bash
npm run version:major
```

---

# Release Local Completa

## Patch + Build Windows

```bash
npm run release:patch:win
```

Executa:

```text
Atualiza versão
    ↓
Build Angular
    ↓
Build Spring Boot
    ↓
Prepara Electron
    ↓
Gera Instalador Windows
```

Ainda não publica nenhuma versão.

---

# Publicação

Após validar o instalador:

```bash
npm run release:publish
```

Esse comando executa:

```text
git add .
git commit
git tag vX.X.X
git push
git push origin vX.X.X
```

---

# GitHub Actions

A pipeline é executada automaticamente quando uma tag é enviada:

```yaml
on:
  push:
    tags:
      - "v*"
```

Exemplo:

```bash
git tag v1.0.67
git push origin v1.0.67
```

Fluxo:

```text
Tag
    ↓
GitHub Actions
    ↓
Build Electron
    ↓
Electron Builder
    ↓
GitHub Release
```

---

# Atualizações Automáticas

O projeto utiliza:

```text
electron-updater
```

Provider:

```text
GitHub Releases
```

Fluxo:

```text
Nova Release Publicada
    ↓
Usuário abre o aplicativo
    ↓
Verificação de atualização
    ↓
Download
    ↓
Instalação
```

Quando uma nova versão é publicada, os usuários já instalados podem receber a atualização automaticamente.

---

# Artefatos Ignorados

Arquivos gerados automaticamente:

```text
/dist/
/release/
/node_modules/

/backend/jre/
/backend/syncdb.jar

/jres/windows/
/jres/linux/
/jres/macos/
```

---

# Segurança

* JRE embarcada
* Sem dependência de Java externo
* Backend isolado localmente
* Comunicação protegida via preload.js
* Distribuição controlada via GitHub Releases

---

# Licença

MIT

---

# Autor

Ramon Barbosa
