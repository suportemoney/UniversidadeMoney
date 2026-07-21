import { apiFetch } from "./api";

export const gestaoApi = {
  resumo: () => apiFetch("/gestao/resumo/"),
  setores: () => apiFetch("/gestao/setores/"),
  listarSetores: () => apiFetch("/gestao/setores/"),
  criarSetor: (data) =>
    apiFetch("/gestao/setores/", { method: "POST", body: JSON.stringify(data) }),
  atualizarSetor: (id, data) =>
    apiFetch(`/gestao/setores/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirSetor: (id) => apiFetch(`/gestao/setores/${id}/`, { method: "DELETE" }),
  usuarios: (q) => apiFetch(`/gestao/usuarios/${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  criarUsuarioEquipe: (data) =>
    apiFetch("/gestao/usuarios/", { method: "POST", body: JSON.stringify(data) }),
  atualizarUsuarioEquipe: (userId, data) =>
    apiFetch(`/gestao/usuarios/${userId}/`, { method: "PATCH", body: JSON.stringify(data) }),
  inativarUsuarioEquipe: (userId) =>
    apiFetch(`/gestao/usuarios/${userId}/`, { method: "DELETE" }),
  toggleEquipe: (userId, isMembro) =>
    apiFetch(`/gestao/usuarios/${userId}/equipe/`, {
      method: "PATCH",
      body: JSON.stringify({ is_membro_equipe: isMembro }),
    }),

  listarCursos: (status) =>
    apiFetch(`/gestao/cursos/${status ? `?status=${status}` : ""}`),
  cursosDisponiveis: () => apiFetch("/gestao/cursos/disponiveis/"),
  obterCurso: (id) => apiFetch(`/gestao/cursos/${id}/`),
  criarCurso: (data) =>
    apiFetch("/gestao/cursos/", { method: "POST", body: JSON.stringify(data) }),
  atualizarCurso: (id, data) =>
    apiFetch(`/gestao/cursos/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirCurso: (id) => apiFetch(`/gestao/cursos/${id}/`, { method: "DELETE" }),
  publicarCurso: (id) => apiFetch(`/gestao/cursos/${id}/publicar/`, { method: "POST" }),
  arquivarCurso: (id) => apiFetch(`/gestao/cursos/${id}/arquivar/`, { method: "POST" }),

  listarModulos: (cursoId) => apiFetch(`/gestao/cursos/${cursoId}/modulos/`),
  criarModulo: (cursoId, data) =>
    apiFetch(`/gestao/cursos/${cursoId}/modulos/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  atualizarModulo: (id, data) =>
    apiFetch(`/gestao/modulos/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirModulo: (id) => apiFetch(`/gestao/modulos/${id}/`, { method: "DELETE" }),
  reordenarModulos: (cursoId, ordem) =>
    apiFetch(`/gestao/cursos/${cursoId}/modulos/reordenar/`, {
      method: "POST",
      body: JSON.stringify({ ordem }),
    }),

  listarParticipantes: (cursoId) => apiFetch(`/gestao/cursos/${cursoId}/participantes/`),
  criarParticipante: (cursoId, data) =>
    apiFetch(`/gestao/cursos/${cursoId}/participantes/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  atualizarParticipante: (id, data) =>
    apiFetch(`/gestao/participantes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirParticipante: (id) => apiFetch(`/gestao/participantes/${id}/`, { method: "DELETE" }),

  uploadModuloArquivo: (moduloId, file, titulo, tipo) => {
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("titulo", titulo);
    fd.append("tipo", tipo);
    return apiFetch(`/gestao/modulos/${moduloId}/arquivos/`, { method: "POST", body: fd });
  },
  excluirModuloArquivo: (id) =>
    apiFetch(`/gestao/modulos/arquivos/${id}/`, { method: "DELETE" }),

  criarAula: (moduloId, data) =>
    apiFetch(`/gestao/modulos/${moduloId}/aulas/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  atualizarAula: (id, data) =>
    apiFetch(`/gestao/aulas/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirAula: (id) => apiFetch(`/gestao/aulas/${id}/`, { method: "DELETE" }),
  uploadVideo: (aulaId, file, duracaoSegundos) => {
    const fd = new FormData();
    fd.append("video", file);
    if (duracaoSegundos) fd.append("duracao_segundos", duracaoSegundos);
    return apiFetch(`/gestao/aulas/${aulaId}/upload-video/`, { method: "POST", body: fd });
  },
  removerVideo: (aulaId) =>
    apiFetch(`/gestao/aulas/${aulaId}/video/`, { method: "DELETE" }),

  criarAtividade: (moduloId, data) =>
    apiFetch(`/gestao/modulos/${moduloId}/atividades/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  excluirAtividade: (id) => apiFetch(`/gestao/atividades/${id}/`, { method: "DELETE" }),
  criarQuestaoAtividade: (atividadeId, data) =>
    apiFetch(`/gestao/atividades/${atividadeId}/questoes/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  excluirQuestao: (id) => apiFetch(`/gestao/questoes/${id}/`, { method: "DELETE" }),

  obterProva: (cursoId) => apiFetch(`/gestao/cursos/${cursoId}/prova/`),
  salvarProva: (cursoId, data) =>
    apiFetch(`/gestao/cursos/${cursoId}/prova/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  criarQuestaoProva: (provaId, data) =>
    apiFetch(`/gestao/provas/${provaId}/questoes/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listarTrilhas: () => apiFetch("/gestao/trilhas/"),
  obterTrilha: (id) => apiFetch(`/gestao/trilhas/${id}/`),
  criarTrilha: (data) =>
    apiFetch("/gestao/trilhas/", { method: "POST", body: JSON.stringify(data) }),
  atualizarTrilha: (id, data) =>
    apiFetch(`/gestao/trilhas/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirTrilha: (id) => apiFetch(`/gestao/trilhas/${id}/`, { method: "DELETE" }),
  definirCursosTrilha: (trilhaId, cursoIds) =>
    apiFetch(`/gestao/trilhas/${trilhaId}/cursos/`, {
      method: "POST",
      body: JSON.stringify({ curso_ids: cursoIds }),
    }),

  uploadThumbnail: (cursoId, file) => {
    const fd = new FormData();
    fd.append("thumbnail", file);
    return apiFetch(`/gestao/cursos/${cursoId}/upload-thumbnail/`, { method: "POST", body: fd });
  },

  listarMateriais: (cursoId) => apiFetch(`/gestao/cursos/${cursoId}/materiais/`),
  uploadMaterial: (cursoId, file, titulo) => {
    const fd = new FormData();
    fd.append("arquivo", file);
    fd.append("titulo", titulo);
    return apiFetch(`/gestao/cursos/${cursoId}/materiais/`, { method: "POST", body: fd });
  },
  excluirMaterial: (id) => apiFetch(`/gestao/materiais/${id}/`, { method: "DELETE" }),

  atualizarQuestao: (id, data) =>
    apiFetch(`/gestao/questoes/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  listarComunicados: () => apiFetch("/gestao/comunicados/"),
  criarComunicado: (data) =>
    apiFetch("/gestao/comunicados/", { method: "POST", body: JSON.stringify(data) }),
  atualizarComunicado: (id, data) =>
    apiFetch(`/gestao/comunicados/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirComunicado: (id) => apiFetch(`/gestao/comunicados/${id}/`, { method: "DELETE" }),

  listarAoVivo: () => apiFetch("/gestao/ao-vivo/"),
  criarAoVivo: (data) =>
    apiFetch("/gestao/ao-vivo/", { method: "POST", body: JSON.stringify(data) }),
  atualizarAoVivo: (id, data) =>
    apiFetch(`/gestao/ao-vivo/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirAoVivo: (id) => apiFetch(`/gestao/ao-vivo/${id}/`, { method: "DELETE" }),

  listarBiblioteca: () => apiFetch("/gestao/biblioteca/"),
  criarBiblioteca: (data) =>
    apiFetch("/gestao/biblioteca/", { method: "POST", body: JSON.stringify(data) }),
  atualizarBiblioteca: (id, data) =>
    apiFetch(`/gestao/biblioteca/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirBiblioteca: (id) => apiFetch(`/gestao/biblioteca/${id}/`, { method: "DELETE" }),
  uploadPdfBiblioteca: (id, file) => {
    const fd = new FormData();
    fd.append("pdf", file);
    return apiFetch(`/gestao/biblioteca/${id}/upload-pdf/`, { method: "POST", body: fd });
  },

  listarTags: () => apiFetch("/gestao/tags/"),
  criarTag: (data) =>
    apiFetch("/gestao/tags/", { method: "POST", body: JSON.stringify(data) }),
  atualizarTag: (id, data) =>
    apiFetch(`/gestao/tags/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  excluirTag: (id) => apiFetch(`/gestao/tags/${id}/`, { method: "DELETE" }),

  listarConvites: () => apiFetch("/gestao/convites/"),
  criarConvite: (data) =>
    apiFetch("/gestao/convites/", { method: "POST", body: JSON.stringify(data) }),
  revogarConvite: (id) =>
    apiFetch(`/gestao/convites/${id}/revogar/`, { method: "POST" }),
  regenerarConvite: (userId) =>
    apiFetch(`/gestao/convites/usuario/${userId}/regenerar/`, { method: "POST" }),
  redefinirSenhaConvite: (userId) =>
    apiFetch(`/gestao/convites/usuario/${userId}/redefinir-senha/`, { method: "POST" }),
  obterPerfilConvite: (userId) =>
    apiFetch(`/gestao/convites/usuario/${userId}/perfil/`),

  catalogoApiDocs: () => apiFetch("/gestao/api-docs/catalogo/"),
  listarApiTokens: () => apiFetch("/gestao/api-docs/tokens/"),
  criarApiTokenTemp: (data = {}) =>
    apiFetch("/gestao/api-docs/tokens/temp/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  revogarApiToken: (id) =>
    apiFetch(`/gestao/api-docs/tokens/${id}/revogar/`, { method: "POST" }),
};
