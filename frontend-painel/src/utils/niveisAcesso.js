/** Constantes e helpers de nível de acesso (espelha o backend). */

export const NIVEL = {
  PADRAO: "padrao",
  INSTRUTOR: "instrutor",
  GESTOR: "gestor",
  ADMINISTRADOR: "administrador",
};

export const NIVEL_LABELS = {
  padrao: "Padrão",
  instrutor: "Instrutor",
  gestor: "Gestor",
  administrador: "Administrador",
};

/** Níveis criados/listados em Equipe de gestão */
export const NIVEIS_EQUIPE = [
  { value: "instrutor", label: "Instrutor" },
  { value: "gestor", label: "Gestor" },
  { value: "administrador", label: "Administrador" },
];

/** @deprecated use NIVEIS_EQUIPE — mantido para compat */
export const NIVEIS_CONVITE = NIVEIS_EQUIPE;

export function ehNivelEquipe(user) {
  if (user?.is_superuser) return true;
  const n = user?.nivel_acesso;
  return n === NIVEL.INSTRUTOR || n === NIVEL.GESTOR || n === NIVEL.ADMINISTRADOR;
}

export function labelNivel(user) {
  const n = user?.nivel_acesso;
  return NIVEL_LABELS[n] || user?.cargo || "Colaborador";
}

export function podeExcluir(user) {
  return Boolean(user?.pode_excluir || user?.nivel_acesso === NIVEL.ADMINISTRADOR);
}

export function niveisDisponiveisParaConvite() {
  // Convidados = apenas padrão
  return [{ value: NIVEL.PADRAO, label: NIVEL_LABELS.padrao }];
}

/** Filtra itens do menu conforme flags do /me */
export function itemMenuPermitido(item, user) {
  if (!user) return false;
  if (item.adminOnly || item.superOnly) {
    return Boolean(user.pode_equipe || user.nivel_acesso === NIVEL.ADMINISTRADOR);
  }
  if (item.apiOnly) {
    return Boolean(user.pode_api);
  }
  if (item.convitesOnly) {
    return Boolean(user.pode_convites);
  }
  if (user.escopo_cursos_apenas) {
    return Boolean(item.instrutorOk);
  }
  return true;
}

/** Rotas permitidas para o usuário no painel */
export function rotaPermitida(pathname, user) {
  if (!user?.pode_gestao) return false;
  if (user.escopo_cursos_apenas) {
    return pathname === "/gestao" || pathname.startsWith("/gestao/cursos");
  }
  if (pathname.startsWith("/gestao/api") && !user.pode_api) return false;
  if (pathname.startsWith("/gestao/equipe") && !user.pode_equipe) return false;
  if (pathname.startsWith("/gestao/convites") && !user.pode_convites) return false;
  return true;
}
