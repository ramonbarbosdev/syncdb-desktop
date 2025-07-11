@echo off

REM === Lendo token do arquivo .env ===
for /f "tokens=1,2 delims==" %%a in ('type ".env"') do (
    if "%%a"=="GH_TOKEN" set GH_TOKEN=%%b
)

echo.
echo === TOKEN carregado: %GH_TOKEN%

echo.
echo === Atualizando Realese ===
npm version patch

echo.
echo === Build Realese Atual ===
npx electron-builder --win --x64 --publish always 

echo.
echo === Processo concluído com sucesso! ===
pause