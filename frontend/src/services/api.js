const API_URL = import.meta.env.VITE_API_URL || "/api";

const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated() {
  return !!getAccessToken();
}

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.detail ||
      data.message ||
      Object.values(data).flat().join(" ") ||
      `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse(res);
}

export async function register(nome, email, cpf, password) {
  return apiFetch("/auth/register/", {
    method: "POST",
    body: JSON.stringify({ nome, email, cpf, password }),
  });
}

export async function login(email, password) {
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username: email.trim().toLowerCase(), password }),
  });
  setTokens(data.access, data.refresh);
  return data;
}

export async function getMe() {
  return apiFetch("/auth/me/");
}

export async function getDashboard() {
  return apiFetch("/dashboard/");
}

export async function matricularCurso(cursoId) {
  return apiFetch(`/cursos/${cursoId}/matricular/`, { method: "POST" });
}

export async function logout() {
  clearTokens();
}
