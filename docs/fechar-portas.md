# Portas locais do SyncDB Desktop

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend (Electron) | **47832** | http://127.0.0.1:47832 |
| API Java (instalador) | **47831** | http://127.0.0.1:47831/sincdb |
| API Java (dev no IDE) | **8081** | http://localhost:8081/sincdb |

O instalador **não** usa a 8081, para não conflitar com Spring Boot aberto no desenvolvimento.

## Ver quem está usando a porta (Windows)

```text
netstat -ano | findstr :47831
```

Exemplo:

```text
TCP    127.0.0.1:47831    0.0.0.0:0    LISTENING    1234
tasklist /fi "PID eq 1234"
taskkill /PID 1234 /F
```

## Testar o backend manualmente (instalador)

Pasta típica:

```text
...\SyncDB Desktop\resources\backend
```

Comando:

```text
jre\bin\java.exe -jar syncdb.jar --server.port=47831
```

## Uma instância do app

O Electron usa `requestSingleInstanceLock`: abrir de novo só foca a janela existente — **não** sobe um segundo Java na mesma máquina pelo atalho.

Se a porta 47831 continuar ocupada após fechar o app, pode ser processo Java órfão — use `netstat` / `taskkill` ou reinicie o PC.
