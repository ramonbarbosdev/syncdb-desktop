/** Portas locais do SyncDB Desktop (evitar conflito com dev Spring em 8081). */
const FRONTEND_PORT = 47832;
const BACKEND_PORT = 47831;
const BACKEND_CONTEXT_PATH = "/sincdb";

function backendApiBaseUrl() {
  return `http://127.0.0.1:${BACKEND_PORT}${BACKEND_CONTEXT_PATH}`;
}

function backendWebSocketUrl() {
  return `//127.0.0.1:${BACKEND_PORT}${BACKEND_CONTEXT_PATH}/sincdb-socket`;
}

module.exports = {
  FRONTEND_PORT,
  BACKEND_PORT,
  BACKEND_CONTEXT_PATH,
  backendApiBaseUrl,
  backendWebSocketUrl,
};
