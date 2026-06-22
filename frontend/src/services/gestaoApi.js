import { getAccessToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "/api";

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.detail ||
      data.message ||
      (data.erros && data.erros.join(" ")) ||
      Object.values(data).flat().join(" ") ||
      `Erro HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

async function gestaoFetch(path, options = {}) {
  const headers = { ...options.headers };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  return parseResponse(res);
}

export const gestaoApi = {
  resumo: () => gestaoFetch("/gestao/resumo/"),
  setores: () => gestaoFetch("/gestao/setores/"),
  usuarios: (q) => gestaoFetch(`/gestao/usuarios/${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  toggleEquipe: (userId, isMembro) =>
    gestaoFetch(`/gestao/usuarios/${userId}/equipe/`, {
      method: "PATCH",
      body: JSON.stringify({ is_membro_equipe: isMembro }),
    }),

  listarCursos: (status) =>
    gestaoFetch(`/gestao/cursos/${status ? `?status=${status}` : ""}`),
  cursosDisponiveis: () => gestaoFetch("/gestao/cursos/disponiveis/"),
  obterCurso: (id) => gestaoFetch(`/gestao/cursos/${id}/`),
  criarCurso: (data) =>
    gestaoFetch("/gestao/cursos/", { method: "POST", body: JSON.stringify(data) }),
  atualizarCurso: (id, data) =>
    gestaoFetch(`/gestao/cursos/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirCurso: (id) => gestaoFetch(`/gestao/cursos/${id}/`, { method: "DELETE" }),
  publicarCurso: (id) => gestaoFetch(`/gestao/cursos/${id}/publicar/`, { method: "POST" }),
  arquivarCurso: (id) => gestaoFetch(`/gestao/cursos/${id}/arquivar/`, { method: "POST" }),

  listarModulos: (cursoId) => gestaoFetch(`/gestao/cursos/${cursoId}/modulos/`),
  criarModulo: (cursoId, data) =>
    gestaoFetch(`/gestao/cursos/${cursoId}/modulos/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  atualizarModulo: (id, data) =>
    gestaoFetch(`/gestao/modulos/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirModulo: (id) => gestaoFetch(`/gestao/modulos/${id}/`, { method: "DELETE" }),
  reordenarModulos: (cursoId, ordem) =>
    gestaoFetch(`/gestao/cursos/${cursoId}/modulos/reordenar/`, {
      method: "POST",
      body: JSON.stringify({ ordem }),
    }),

  criarAula: (moduloId, data) =>
    gestaoFetch(`/gestao/modulos/${moduloId}/aulas/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  atualizarAula: (id, data) =>
    gestaoFetch(`/gestao/aulas/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirAula: (id) => gestaoFetch(`/gestao/aulas/${id}/`, { method: "DELETE" }),
  uploadVideo: (aulaId, file, duracaoSegundos) => {
    const fd = new FormData();
    fd.append("video", file);
    if (duracaoSegundos) fd.append("duracao_segundos", duracaoSegundos);
    return gestaoFetch(`/gestao/aulas/${aulaId}/upload-video/`, { method: "POST", body: fd });
  },
  removerVideo: (aulaId) =>
    gestaoFetch(`/gestao/aulas/${aulaId}/video/`, { method: "DELETE" }),

  criarAtividade: (moduloId, data) =>
    gestaoFetch(`/gestao/modulos/${moduloId}/atividades/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  excluirAtividade: (id) => gestaoFetch(`/gestao/atividades/${id}/`, { method: "DELETE" }),
  criarQuestaoAtividade: (atividadeId, data) =>
    gestaoFetch(`/gestao/atividades/${atividadeId}/questoes/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  excluirQuestao: (id) => gestaoFetch(`/gestao/questoes/${id}/`, { method: "DELETE" }),

  obterProva: (cursoId) => gestaoFetch(`/gestao/cursos/${cursoId}/prova/`),
  salvarProva: (cursoId, data) =>
    gestaoFetch(`/gestao/cursos/${cursoId}/prova/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  criarQuestaoProva: (provaId, data) =>
    gestaoFetch(`/gestao/provas/${provaId}/questoes/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listarTrilhas: () => gestaoFetch("/gestao/trilhas/"),
  obterTrilha: (id) => gestaoFetch(`/gestao/trilhas/${id}/`),
  criarTrilha: (data) =>
    gestaoFetch("/gestao/trilhas/", { method: "POST", body: JSON.stringify(data) }),
  atualizarTrilha: (id, data) =>
    gestaoFetch(`/gestao/trilhas/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirTrilha: (id) => gestaoFetch(`/gestao/trilhas/${id}/`, { method: "DELETE" }),
  definirCursosTrilha: (trilhaId, cursoIds) =>
    gestaoFetch(`/gestao/trilhas/${trilhaId}/cursos/`, {
      method: "POST",
      body: JSON.stringify({ curso_ids: cursoIds }),
    }),

  uploadThumbnail: (cursoId, file) => {
    const fd = new FormData();
    fd.append("thumbnail", file);
    return gestaoFetch(`/gestao/cursos/${cursoId}/upload-thumbnail/`, { method: "POST", body: fd });
  },

  atualizarQuestao: (id, data) =>
    gestaoFetch(`/gestao/questoes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  listarComunicados: () => gestaoFetch("/gestao/comunicados/"),
  criarComunicado: (data) =>
    gestaoFetch("/gestao/comunicados/", { method: "POST", body: JSON.stringify(data) }),
  atualizarComunicado: (id, data) =>
    gestaoFetch(`/gestao/comunicados/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirComunicado: (id) => gestaoFetch(`/gestao/comunicados/${id}/`, { method: "DELETE" }),

  listarAoVivo: () => gestaoFetch("/gestao/ao-vivo/"),
  criarAoVivo: (data) =>
    gestaoFetch("/gestao/ao-vivo/", { method: "POST", body: JSON.stringify(data) }),
  atualizarAoVivo: (id, data) =>
    gestaoFetch(`/gestao/ao-vivo/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirAoVivo: (id) => gestaoFetch(`/gestao/ao-vivo/${id}/`, { method: "DELETE" }),

  listarBiblioteca: () => gestaoFetch("/gestao/biblioteca/"),
  criarBiblioteca: (data) =>
    gestaoFetch("/gestao/biblioteca/", { method: "POST", body: JSON.stringify(data) }),
  atualizarBiblioteca: (id, data) =>
    gestaoFetch(`/gestao/biblioteca/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirBiblioteca: (id) => gestaoFetch(`/gestao/biblioteca/${id}/`, { method: "DELETE" }),
  uploadPdfBiblioteca: (id, file) => {
    const fd = new FormData();
    fd.append("pdf", file);
    return gestaoFetch(`/gestao/biblioteca/${id}/upload-pdf/`, { method: "POST", body: fd });
  },

  listarPlanos: () => gestaoFetch("/gestao/planos/"),
  criarPlano: (data) =>
    gestaoFetch("/gestao/planos/", { method: "POST", body: JSON.stringify(data) }),
  atualizarPlano: (id, data) =>
    gestaoFetch(`/gestao/planos/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirPlano: (id) => gestaoFetch(`/gestao/planos/${id}/`, { method: "DELETE" }),

  listarTokens: () => gestaoFetch("/gestao/tokens/"),
  criarToken: (data) =>
    gestaoFetch("/gestao/tokens/", { method: "POST", body: JSON.stringify(data) }),
  atualizarToken: (id, data) =>
    gestaoFetch(`/gestao/tokens/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  listarTokenUsos: (id) => gestaoFetch(`/gestao/tokens/${id}/usos/`),
};
