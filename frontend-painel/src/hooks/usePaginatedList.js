import { useMemo, useState } from "react";

export default function usePaginatedList(items, { search = "", searchKeys = ["titulo", "nome"], pageSize = 10 } = {}) {
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState(search);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return items;
    return items.filter((item) =>
      searchKeys.some((key) => String(item[key] ?? "").toLowerCase().includes(termo))
    );
  }, [items, busca, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const paginaAtual = Math.min(page, totalPages);

  const paginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * pageSize;
    return filtrados.slice(inicio, inicio + pageSize);
  }, [filtrados, paginaAtual, pageSize]);

  const setBuscaComReset = (valor) => {
    setBusca(valor);
    setPage(1);
  };

  return {
    busca,
    setBusca: setBuscaComReset,
    page: paginaAtual,
    setPage,
    filtrados,
    paginados,
    totalPages,
    totalItems: filtrados.length,
    pageSize,
  };
}
