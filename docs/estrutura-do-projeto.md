# Estrutura do projeto SyncDB Desktop

Este documento explica como o projeto esta organizado e como as partes principais se conectam.

## Visao geral

O SyncDB Desktop e um aplicativo desktop feito com Electron. Ele empacota tres partes principais:

- uma aplicacao Electron, responsavel por abrir a janela desktop;
- um frontend Angular ja compilado, servido localmente pelo proprio Electron;
- um backend Spring Boot em formato JAR, executado com uma JRE portatil incluida no app.

Quando o usuario abre o programa, o Electron inicia a janela, sobe o backend Java em uma porta local e carrega o frontend Angular dentro da janela.

## Estrutura de pastas e arquivos

```text
syncdb-desktop/
|-- assets/
|   |-- icon.ico
|   `-- icon.icns
|-- backend/
|   |-- syncdb.jar
|   |-- jre/
|   `-- instrucao.txt
|-- dist/
|   `-- browser/
|-- docs/
|   |-- estrutura-do-projeto.md
|   |-- fechar-portas.md
|   `-- tutor-build-angular.md
|-- release/
|-- back-end.js
|-- main.js
|-- package.json
|-- preload.js
|-- updater.js
`-- window.js
```

## Arquivos principais

### `package.json`

Define o nome, versao, scripts, dependencias e configuracoes do `electron-builder`.

Scripts principais:

```bash
npm start
npm run build:win
npm run build:mac
npm run build:linux
```

O bloco `build` define:

- `appId` e `productName` do aplicativo;
- arquivos que entram no pacote final;
- recursos extras, como `backend/syncdb.jar` e `backend/jre`;
- pasta de saida dos instaladores em `release/`;
- publicacao de releases no GitHub.

### `main.js`

E o processo principal do Electron.

Responsabilidades:

- inicializar o app quando o Electron estiver pronto;
- criar a janela principal;
- configurar o auto updater;
- iniciar o backend;
- registrar canais IPC usados pelo frontend;
- encerrar o backend e o servidor local quando o app for fechado.

Fluxo principal:

```text
Electron pronto
  -> cria janela
  -> configura atualizador
  -> inicia backend Java
  -> encerra processos ao sair
```

### `window.js`

Cria a janela do Electron e serve o frontend Angular compilado.

Responsabilidades:

- criar uma `BrowserWindow`;
- configurar `preload.js`;
- iniciar um servidor HTTP interno em `127.0.0.1`;
- carregar o `index.html` do Angular;
- tratar fallback de SPA, enviando `index.html` quando a rota nao for um arquivo real;
- bloquear `Ctrl+R`, `Cmd+R` e `F5` para recarregar sempre a URL base correta.

O frontend esperado fica em:

```text
dist/browser/browser/
```

### `back-end.js`

Inicia o backend Spring Boot.

Responsabilidades:

- localizar o arquivo `backend/syncdb.jar`;
- localizar a JRE portatil em `backend/jre`;
- executar o Java com `spawn`;
- subir o backend na porta `8081`;
- finalizar o processo Java quando o app fechar.

Comando equivalente executado internamente:

```bash
jre/bin/java -jar syncdb.jar --server.port=8081
```

No Windows, o executavel usado e:

```text
backend/jre/bin/java.exe
```

Quando o app esta empacotado, os arquivos sao lidos de `process.resourcesPath`.

### `preload.js`

Faz a ponte segura entre o frontend Angular e o processo principal do Electron.

Ele expoe no navegador o objeto:

```js
window.updater
```

Esse objeto permite ao frontend:

- ouvir quando existe atualizacao disponivel;
- receber progresso de download;
- saber quando a atualizacao foi baixada;
- receber erros de atualizacao;
- iniciar o download;
- instalar a atualizacao;
- checar atualizacoes manualmente.

### `updater.js`

Configura o `electron-updater`.

Responsabilidades:

- verificar atualizacoes no GitHub Releases;
- impedir download automatico com `autoDownload = false`;
- avisar o frontend quando houver atualizacao;
- enviar progresso de download;
- instalar a atualizacao com `quitAndInstall`.

Eventos enviados para o frontend:

```text
update-available
update-progress
update-downloaded
update-error
```

### `assets/`

Guarda os icones usados no build do aplicativo.

Exemplos:

- `icon.ico` para Windows;
- `icon.icns` para macOS.

### `backend/`

Guarda os arquivos necessarios para executar o backend dentro do app desktop.

Itens esperados:

- `syncdb.jar`: backend Spring Boot compilado;
- `jre/`: Java Runtime portatil usado para executar o JAR.

O usuario final nao precisa instalar Java na maquina, porque a JRE vai junto no pacote.

### `dist/`

Guarda o build compilado do frontend Angular.

O Electron nao roda o Angular em modo desenvolvimento no pacote final. Ele serve os arquivos estaticos ja gerados pelo build.

### `release/`

Pasta de saida do `electron-builder`.

Depois de rodar os comandos de build, os instaladores e pacotes gerados aparecem nessa pasta.

### `docs/`

Pasta com documentacoes auxiliares do projeto.

Arquivos atuais:

- `estrutura-do-projeto.md`: este documento;
- `fechar-portas.md`: comandos para descobrir e matar processos por porta;
- `tutor-build-angular.md`: comandos rapidos para build do Angular.

## Fluxo de inicializacao

```text
1. Usuario abre o aplicativo.
2. Electron executa `main.js`.
3. `main.js` cria a janela com `createWindow()`.
4. `window.js` inicia um servidor HTTP local para o Angular.
5. A janela carrega o frontend servido localmente.
6. `main.js` chama `startBackend()`.
7. `back-end.js` executa a JRE portatil com o `syncdb.jar`.
8. O backend Spring Boot sobe na porta 8081.
9. O frontend se comunica com o backend local.
10. O updater verifica novas versoes no GitHub Releases.
```

## Fluxo de atualizacao

```text
1. `updater.js` verifica atualizacoes.
2. Se existir nova versao, envia `update-available` para o frontend.
3. O frontend pode chamar `window.updater.startDownload()`.
4. O progresso e enviado por `update-progress`.
5. Ao terminar, envia `update-downloaded`.
6. O frontend pode chamar `window.updater.installUpdate()`.
7. O app fecha e instala a nova versao.
```

## Build do frontend

O build do Angular deve gerar os arquivos usados pelo Electron dentro de `dist/browser`.

Comando documentado no projeto:

```bash
ng build --configuration production --base-href ./
```

## Build do backend

O backend precisa ser compilado como JAR e copiado para:

```text
backend/syncdb.jar
```

A JRE portatil tambem precisa existir em:

```text
backend/jre/
```

## Build do aplicativo desktop

Instale as dependencias:

```bash
npm install
```

Gere o instalador do Windows:

```bash
npm run build:win
```

Gere o pacote do macOS:

```bash
npm run build:mac
```

Gere o pacote do Linux:

```bash
npm run build:linux
```

## Publicacao

O projeto esta configurado para publicar releases no GitHub:

```text
owner: ramonbarbosdev
repo: syncdb-desktop
provider: github
```

Para publicar usando `electron-builder`, normalmente e necessario configurar `GH_TOKEN` no ambiente antes do build com publicacao.

## Observacoes importantes

- A porta padrao do backend e `8081`.
- O frontend e servido por uma porta local aleatoria escolhida pelo sistema.
- O backend depende de `backend/syncdb.jar`.
- O app depende da JRE portatil em `backend/jre`.
- No pacote final, `syncdb.jar` e `jre` entram como `extraResources`.
- O fechamento do app tenta encerrar o processo Java usando `tree-kill`.
