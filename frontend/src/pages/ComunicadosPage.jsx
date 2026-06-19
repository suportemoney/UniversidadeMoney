import { useEffect, useState } from "react";
import { getComunicados } from "../services/api";

const TIPOS = [
  { value: "", label: "Todos" },
  { value: "info", label: "Informação" },
  { value: "trofeu", label: "Conquistas" },
  { value: "megafone", label: "Avisos" },
];

const ICON = { info: "ℹ️", trofeu: "🏆", megafone: "📣" };

export default function ComunicadosPage() {
  const [tipo, setTipo] = useState("");
  const [itens, setItens] = useState([]);

  useEffect(() => {
    getComunicados(tipo || undefined).then(setItens);
  }, [tipo]);

  return (
    <div>
      <h1>Comunicados internos</h1>
      <div className="gestao-filters">
        {TIPOS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`btn btn-sm ${tipo === t.value ? "btn-primary" : "btn-outline"}`}
            onClick={() => setTipo(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul className="dash-list">
        {itens.map((c) => (
          <li key={c.id} className="dash-list-item">
            <span>{ICON[c.tipo] || "ℹ️"}</span>
            <div>
              <strong>{c.titulo}</strong>
              <p>{c.conteudo}</p>
              <small>{new Date(c.criado_em).toLocaleString("pt-BR")}</small>
            </div>
          </li>
        ))}
        {itens.length === 0 && <p>Nenhum comunicado.</p>}
      </ul>
    </div>
  );
}
