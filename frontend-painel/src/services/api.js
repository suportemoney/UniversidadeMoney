const API_URL = import.meta.env.VITE_API_URL || "/api";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated() {
  return !!getAccessToken();
}

function mensagemErro(data, status) {
  if (status === 401) {
    return "Sessão expirada. Faça login novamente.";
  }
  const msg =
    data.detail ||
    data.message ||
    (data.erros && data.erros.join(" ")) ||
    Object.values(data).flat().join(" ") ||
    `Erro HTTP ${status}`;
  if (typeof msg === "string" && msg.includes("token not valid")) {
    return "Sessão expirada. Faça login novamente.";
  }
  return typeof msg === "string" ? msg : JSON.stringify(msg);
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mensagemErro(data, res.status));
  }
  return data;
}

let refreshEmAndamento = null;

async function renovarAccessToken() {
  if (!refreshEmAndamento) {
    refreshEmAndamento = (async () => {
      const refresh = getRefreshToken();
      if (!refresh) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      const res = await fetch(`${API_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        clearTokens();
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      setTokens(data.access, data.refresh || refresh);
      return data.access;
    })().finally(() => {
      refreshEmAndamento = null;
    });
  }
  return refreshEmAndamento;
}

export async function apiFetch(path, options = {}, jaRenovou = false) {
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  const rotaAuth = path.startsWith("/auth/login/") || path.startsWith("/auth/register/");
  if (res.status === 401 && !jaRenovou && !rotaAuth && token && getRefreshToken()) {
    try {
      await renovarAccessToken();
      return apiFetch(path, options, true);
    } catch (err) {
      clearTokens();
      throw err;
    }
  }

  return parseResponse(res);
}

export async function register(nome, email, cpf, password) {
  return apiFetch("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ nome, email, cpf, password }),
  });
}

export async function login(identificador, password) {
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username: identificador.trim(), password }),
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function getMe() {
  return apiFetch("/auth/me/");
}

export async function updateMe(data) {
  return apiFetch("/auth/me/", { method: "PATCH", body: JSON.stringify(data) });
}

export async function getDashboard() {
  return apiFetch("/dashboard/");
}

export async function matricularCurso(cursoId) {
  return apiFetch(`/cursos/${cursoId}/matricular/`, { method: "POST" });
}

export async function buscar(q) {
  return apiFetch(`/busca/?q=${encodeURIComponent(q)}`);
}

export async function getCatalogoCursos(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/cursos/${qs ? `?${qs}` : ""}`);
}

export async function getCursoDetalhe(id) {
  return apiFetch(`/cursos/${id}/detalhe/`);
}

export async function getTrilhas() {
  return apiFetch("/trilhas/");
}

export async function getTrilha(id) {
  return apiFetch(`/trilhas/${id}/`);
}

export async function getCertificados() {
  return apiFetch("/certificados/");
}

export async function getProgresso() {
  return apiFetch("/progresso/");
}

export async function getComunicados(tipo) {
  return apiFetch(`/comunicados/${tipo ? `?tipo=${tipo}` : ""}`);
}

export async function getComunicadosNaoLidos() {
  return apiFetch("/comunicados/nao-lidos/");
}

export async function marcarComunicadoLido(id) {
  return apiFetch(`/comunicados/${id}/lido/`, { method: "POST" });
}

export async function getAoVivo() {
  return apiFetch("/ao-vivo/");
}

export async function inscreverAoVivo(id) {
  return apiFetch(`/ao-vivo/${id}/inscrever/`, { method: "POST" });
}

export async function getBiblioteca(setor) {
  return apiFetch(`/biblioteca/${setor ? `?setor=${setor}` : ""}`);
}

export async function getConquistas() {
  return apiFetch("/conquistas/");
}

export function certificadoDownloadUrl(id) {
  return `${API_URL}/certificados/${id}/download/`;
}

export async function logout() {
  clearTokens();
}

export async function resgatarToken(chave) {
  return apiFetch("/planos/resgatar/", {
    method: "POST",
    body: JSON.stringify({ chave }),
  });
}

export async function getMinhaAssinatura() {
  return apiFetch("/planos/minha-assinatura/");
}

export async function getCatalogoPlanos() {
  return apiFetch("/planos/catalogo/");
}
