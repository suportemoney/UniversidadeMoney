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

function isRotaAuthPublica(path) {
  return (
    path.startsWith("/auth/login/") ||
    path.startsWith("/auth/register/") ||
    path.startsWith("/auth/api-tokens/trocar/")
  );
}

function mensagemErro(data, status, path) {
  // Lista de erros de validação (ex.: publicar curso)
  if (Array.isArray(data?.erros) && data.erros.length) {
    return data.erros.join(" · ");
  }

  const detail =
    data.detail ||
    data.message ||
    (typeof data === "object" ? Object.values(data).flat().join(" ") : "") ||
    `Erro HTTP ${status}`;

  const detalheStr = typeof detail === "string" ? detail : JSON.stringify(detail);

  // Rotas públicas: nunca mascarar como "sessão expirada"
  if (isRotaAuthPublica(path)) {
    if (status === 401 || status === 403) {
      if (detalheStr.includes("token not valid") || detalheStr.includes("token_not_valid")) {
        return "Credenciais inválidas. Limpe o cache e tente de novo.";
      }
      return detalheStr || "Credenciais inválidas.";
    }
    return detalheStr;
  }

  if (status === 401 || status === 403) {
    return "Sessão expirada. Faça login novamente.";
  }

  if (detalheStr.includes("token not valid")) {
    return "Sessão expirada. Faça login novamente.";
  }
  return detalheStr;
}

async function parseResponse(res, path) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(mensagemErro(data, res.status, path));
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
  const rotaPublica = isRotaAuthPublica(path);

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  // Não enviar Bearer em login: JWT antigo fazia 403 token_not_valid
  if (rotaPublica) {
    delete headers.Authorization;
  } else {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: rotaPublica ? "omit" : options.credentials,
  });

  const token = getAccessToken();
  if (res.status === 401 && !jaRenovou && !rotaPublica && token && getRefreshToken()) {
    try {
      await renovarAccessToken();
      return apiFetch(path, options, true);
    } catch (err) {
      clearTokens();
      throw err;
    }
  }

  return parseResponse(res, path);
}

export async function login(identificador, password) {
  clearTokens();
  const { payloadLogin } = await import("../utils/loginIdentificador");
  const { getDispositivoToken, setDispositivoToken } = await import("../utils/dispositivoMfa");
  const body = {
    ...payloadLogin(identificador, password),
    dispositivo_token: getDispositivoToken() || undefined,
  };
  const data = await apiFetch("/auth/login/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setTokens(data.access, data.refresh);
  if (data.dispositivo_token) setDispositivoToken(data.dispositivo_token);
  return data;
}

export async function getMe() {
  return apiFetch("/auth/me/");
}

export async function redefinirSenhaObrigatoria(cpf, novaSenha) {
  const data = await apiFetch("/auth/redefinir-senha-obrigatoria/", {
    method: "POST",
    body: JSON.stringify({
      cpf: String(cpf || "").replace(/\D/g, ""),
      nova_senha: novaSenha,
    }),
  });
  if (data.access) setTokens(data.access, data.refresh);
  return data;
}

export async function mfaVerificarCpf(cpf) {
  return apiFetch("/auth/mfa/verificar-cpf/", {
    method: "POST",
    body: JSON.stringify({ cpf: String(cpf || "").replace(/\D/g, "") }),
  });
}

export async function mfaEnroll() {
  return apiFetch("/auth/mfa/enroll/");
}

export async function mfaConfirmar(codigo, confiarDispositivo = false) {
  const { setDispositivoToken } = await import("../utils/dispositivoMfa");
  const data = await apiFetch("/auth/mfa/confirmar/", {
    method: "POST",
    body: JSON.stringify({ codigo, confiar_dispositivo: confiarDispositivo }),
  });
  if (data.access) setTokens(data.access, data.refresh);
  if (data.dispositivo_token) setDispositivoToken(data.dispositivo_token);
  return data;
}

export async function mfaVerificar(codigo, confiarDispositivo = false) {
  const { setDispositivoToken } = await import("../utils/dispositivoMfa");
  const data = await apiFetch("/auth/mfa/verificar/", {
    method: "POST",
    body: JSON.stringify({ codigo, confiar_dispositivo: confiarDispositivo }),
  });
  if (data.access) setTokens(data.access, data.refresh);
  if (data.dispositivo_token) setDispositivoToken(data.dispositivo_token);
  return data;
}

export async function logout() {
  clearTokens();
}
