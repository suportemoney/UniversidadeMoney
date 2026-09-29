/** Destino após login no painel: senha obrigatória ou gestão. */
export function destinoAposAuthPainel(me) {
  if (me?.precisa_redefinir_senha) return "/redefinir-senha";
  return "/gestao";
}
