# Ícones SyncDB (pacote oficial)

Pacote: `syncdb-icons.zip` (pastas `web`, `windows`, `ios`, `linux`, `logo`).

| Pasta no zip | Destino | Uso |
|--------------|---------|-----|
| `web/` | `app-sincdb/public/` | Favicon, PWA, `site.webmanifest` |
| `logo/` | `app-sincdb/public/` | Topbar e splash (`logo.png`, `syncdb-logo.svg`) |
| `windows/syncdb.ico` | `syncdb-desktop/assets/icon.ico` | NSIS, bandeja Windows |
| `ios/icon-1024.png` | `assets/icon.png` + `icon.icns` | electron-builder macOS |
| `linux/syncdb-512.png` | `assets/linux-512.png` | referência; build Linux usa `icon.png` |

## Comando único

```bash
cd syncdb-desktop
npm run import:icons
# ou
npm run import:icons -- "C:/caminho/syncdb-icons.zip"
```

Opções: `--web-only`, `--desktop-only`, `--no-logo`.

## Release

1. Atualize o zip se o designer enviar versão nova.
2. `npm run import:icons`
3. Commit em **app-sincdb** (`public/`, `index.html`) e **syncdb-desktop** (`assets/`).
4. `npm run prepare:release` — **não** regera ícones a partir do favicon web.

`npm run sync:icons` permanece só para fluxo legado (public/favicon.png → assets).