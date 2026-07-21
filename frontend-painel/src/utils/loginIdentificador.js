/** Heurística: 11 dígitos → CPF; senão → username. */
export function payloadLogin(identificador, password) {
  const raw = String(identificador || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) {
    return { cpf: digits, password };
  }
  return { username: raw, password };
}
