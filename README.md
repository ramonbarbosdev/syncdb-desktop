# SyncDB Desktop

O SyncDB Desktop é a distribuição desktop oficial do SyncDB.

A aplicação utiliza Electron para empacotar e distribuir:

* Frontend Angular
* Backend Spring Boot
* Runtime Java embarcado (JRE)
* Atualizações automáticas

O objetivo é permitir que o usuário instale e utilize o sistema sem precisar instalar Java, Node.js ou qualquer dependência adicional.

---

# Como a aplicação funciona

Ao abrir o SyncDB Desktop:

```text
Electron
    ↓
Inicia o backend Spring Boot
    ↓
Carrega o frontend Angular
    ↓
Verifica atualizações
```

Toda a execução acontece localmente na máquina do usuário.

---

# Requisitos para Desenvolvimento

Para desenvolver ou gerar novas versões são necessários:

* Node.js 22+
* Java 21+
* Maven
* Git

---

# Projetos Necessários

O processo de build utiliza três repositórios:

```text
app-sincdb
Frontend Angular

api-sincdb
Backend Spring Boot

syncdb-desktop
Empacotamento Electron
```

Antes de gerar uma versão, todos os projetos devem estar disponíveis localmente.

---

# Configuração Local

O arquivo `build.config.json` informa ao Electron onde localizar os projetos Angular e Spring Boot.

Exemplo Windows:

```json
{
  "frontPath": "C:/Users/Ramon/Documents/dev/app-sincdb",
  "apiPath": "C:/Users/Ramon/Documents/dev/api-sincdb",
  "angularDistPath": "dist/browser",
  "jarName": "syncdb.jar"
}
```

Exemplo macOS:

```json
{
  "frontPath": "/Users/ramon/Documents/dev/app-sincdb",
  "apiPath": "/Users/ramon/Documents/dev/api-sincdb",
  "angularDistPath": "dist/browser",
  "jarName": "syncdb.jar"
}
```

---

# Executando em Desenvolvimento

Para iniciar o Electron:

```bash
npm start
```

---

# Gerando uma Nova Versão

## Preparar Artefatos

Executa automaticamente:

* Build Angular
* Build Spring Boot
* Copia frontend
* Copia JAR
* Copia JRE

Comando:

```bash
npm run prepare:release
```

Esse comando apenas prepara os arquivos necessários.

Nenhum instalador é gerado.

Nenhuma publicação é realizada.

---

## Gerar Instalador

Windows:

```bash
npm run release:win
```

Linux:

```bash
npm run release:linux
```

macOS:

```bash
npm run release:mac
```

Ao final, os instaladores serão gerados na pasta:

```text
release/
```

---

# Versionamento

Patch:

```bash
npm run version:patch
```

Exemplo:

```text
1.0.66 → 1.0.67
```

Minor:

```bash
npm run version:minor
```

Exemplo:

```text
1.0.66 → 1.1.0
```

Major:

```bash
npm run version:major
```

Exemplo:

```text
1.0.66 → 2.0.0
```

---

# Fluxo de Release

## 1. Gerar nova versão

Exemplo Windows:

```bash
npm run release:patch:win
```

O processo:

```text
Atualiza versão
↓
Build Angular
↓
Build API
↓
Prepara Electron
↓
Gera Instalador
```

---

## 2. Validar o instalador

Antes da publicação:

* Instalar localmente
* Verificar inicialização
* Verificar backend
* Verificar frontend
* Verificar atualização

---

## 3. Publicar

Após validação:

```bash
npm run release:publish
```

Esse comando:

```text
Cria commit
↓
Cria tag
↓
Envia para GitHub
```

---
Desbloquear restrinção no MacOS
1. Instalar o app
2. Abrir terminal
3. Execultar 
```text
sudo xattr -dr com.apple.quarantine "/Applications/SyncDB Desktop.app"
open "/Applications/SyncDB Desktop.app"
```
---

# Publicação Automática

Ao enviar uma tag:

```text
v1.0.67
```

o GitHub Actions inicia automaticamente.

Fluxo:

```text
Tag
↓
GitHub Actions
↓
Build
↓
GitHub Release
↓
Disponibilização para atualização automática
```

---

# Atualizações Automáticas

O SyncDB Desktop utiliza Electron Updater integrado ao GitHub Releases.

Quando uma nova versão é publicada:

```text
Usuário abre o sistema
↓
Nova versão encontrada
↓
Download automático
↓
Instalação
```

Nenhuma ação manual é necessária pelo usuário.

---

# Checklist para Produção

Antes de publicar uma nova versão:

* Versão atualizada
* Frontend compilando
* Backend compilando
* Instalador gerado
* Teste local realizado
* GitHub Actions configurado
* Release publicada

---

# Autor

Ramon Barbosa
