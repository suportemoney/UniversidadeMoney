/** Executa fn(id) para cada id; não aborta no primeiro erro. */
export async function executarEmLote(ids, fn) {
  const resultados = await Promise.allSettled(ids.map((id) => fn(id)));
  const ok = resultados.filter((r) => r.status === "fulfilled").length;
  const falhas = resultados.length - ok;
  const erros = resultados
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason?.message || String(r.reason));

  return { ok, falhas, erros, total: ids.length };
}

export function mensagemResultadoLote({ ok, falhas, total }, sucessoLabel = "itens processados") {
  if (falhas === 0) return `${ok} ${sucessoLabel} com sucesso.`;
  return `${ok} de ${total} ${sucessoLabel}. ${falhas} falharam.`;
}
