# 📦 SyncDB - Aplicativo Desktop com Electron + Spring Boot + Angular

Este é um aplicativo desktop desenvolvido com **Electron**, que embute:
- Um **backend em Spring Boot (JAR)**,
- Um **frontend Angular**,
- Uma **JRE portátil**, permitindo execução **sem precisar instalar o Java**,
- E suporte a **atualizações automáticas** via `electron-updater`.

---

## 🚀 Como funciona

- Ao iniciar, o Electron roda a JRE embutida e executa o backend (JAR).
- O Angular é servido localmente via servidor HTTP embutido.
- O `autoUpdater` verifica se há novas versões no GitHub Releases e atualiza automaticamente.
- O SQLite é armazenado localmente na pasta de dados do usuário (`userData`).

---

## 🧾 Estrutura do projeto

---

/electron/ → Arquivos do Electron (main.js, preload.js etc)
/backend/ → Contém o JAR gerado e a JRE portátil
/dist/ → Build do Angular
/jre/ → JRE portátil (copiada em tempo de build)
/package.json → Configurações do Electron Builder


---

## ⚙️ Requisitos para build local

- Node.js ≥ 18
- Java 17 (somente para build do Spring Boot)
- Maven (para compilar o backend)
- Angular CLI (para compilar o frontend)

---

## 🛠️ Build local

### 1. Build do backend (Spring Boot)

cd backend
./mvnw clean package -DskipTests
Gera o syncdb.jar dentro de backend/target/

### 2. Build do frontend (Angular)

cd frontend
npm install
npm run build

### 3. Copie o JAR e a JRE para o local esperado

mkdir -p backend
cp target/syncdb.jar backend/
# Coloque a pasta da JRE portátil em: backend/jre/
Link do JRE: https://drive.google.com/file/d/1ojelh9bPaOSPRMSMtxzh1lX0xQ_HWcX_/view?usp=drive_link

---

### Gerando o instalador com electron-builder

npm install
npx electron-builder --win --x64
set GH_TOKEN=seu_token_clássico
npx electron-builder --win --x64 --publish always

---

###  Segurança
O app usa JRE embarcada, sem depender de instalação externa de Java.

A base de dados é local e criptografável via Spring, se desejar.

###  Autor
Desenvolvedor: Ramon Barbosa

Licença: MIT
