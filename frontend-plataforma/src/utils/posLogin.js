/** URL absoluta do MFA no painel (mesmo host em produção). */
export function urlMfaPainel() {
  const base = (import.meta.env.VITE_PAINEL_URL || "http://localhost:5174").replace(/\/$/, "");
  return `${base}/mfa`;
}

/** Gestor/admin ainda sem 2FA — senha forte só depois do MFA. */
export function precisaMfaPainelPendente(me) {
  return Boolean(me?.pode_gestao && me?.precisa_mfa_painel && !me?.mfa_ok);
}
