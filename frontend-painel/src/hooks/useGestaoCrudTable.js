import { useState } from "react";
import { executarEmLote, mensagemResultadoLote } from "../utils/gestaoLote";
import useGestaoTableSelection from "./useGestaoTableSelection";

/**
 * Hook composto para listagens CRUD com seleção e exclusão em lote.
 */
export default function useGestaoCrudTable(options = {}) {
  const selection = useGestaoTableSelection();
  const [loteOpen, setLoteOpen] = useState(false);
  const [loteLoading, setLoteLoading] = useState(false);
  const [loteMsg, setLoteMsg] = useState("");

  const idsPagina = (itens) => itens.map((item) => item.id);

  const confirmarLote = async (executarFn, labels = {}) => {
    const ids = selection.getSelectedArray();
    if (!ids.length) return;

    setLoteLoading(true);
    setLoteMsg("");
    const resultado = await executarEmLote(ids, executarFn);
    selection.clear();
    setLoteLoading(false);
    setLoteOpen(false);

    if (resultado.falhas > 0) {
      setLoteMsg(mensagemResultadoLote(resultado, labels.sucesso || "itens processados"));
    }

    return resultado;
  };

  return {
    selection,
    loteOpen,
    setLoteOpen,
    loteLoading,
    loteMsg,
    setLoteMsg,
    idsPagina,
    confirmarLote,
  };
}
