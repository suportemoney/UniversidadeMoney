/** Destino após login/MFA no painel: 2FA primeiro, depois senha forte. */
export function destinoAposAuthPainel(me) {
  if (me?.precisa_mfa_painel && !me?.mfa_ok) return "/mfa";
  if (me?.precisa_redefinir_senha) return "/redefinir-senha";
  return "/gestao";
}
