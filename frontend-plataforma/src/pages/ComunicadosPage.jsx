import { useEffect, useState } from "react";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getComunicados } from "../services/api";

const TIPOS = [
  { value: "", label: "Todos" },
  { value: "info", label: "Informação" },
  { value: "trofeu", label: "Conquistas" },
  { value: "megafone", label: "Avisos" },
];

const ICON = { info: "ℹ️", trofeu: "🏆", megafone: "📣" };

function tempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const horas = Math.floor(diff / 3600000);
  if (horas < 1) return "Agora há pouco";
  if (horas < 24) return `Há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
}

export default function ComunicadosPage() {
  const [tipo, setTipo] = useState("");
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getComunicados(tipo || undefined)
      .then(setItens)
      .finally(() => setLoading(false));
  }, [tipo]);

  return (
    <div className="dash-page">
      <PageHeader
        icon="📢"
        titulo="Comunicados internos"
        subtitulo="Notícias, avisos e conquistas da Money Promotora."
      />

      <div className="dash-chips">
        {TIPOS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`dash-chip${tipo === t.value ? " dash-chip--active" : ""}`}
            onClick={() => setTipo(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <PageSkeleton cards={3} />}

      {!loading && itens.length > 0 && (
        <div className="dash-feed">
          {itens.map((c, i) => (
            <article
              key={c.id}
              className={`dash-feed-item dash-feed-item--${c.tipo || "info"}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="dash-feed-icon">{ICON[c.tipo] || "ℹ️"}</span>
              <div className="dash-feed-body">
                <strong>{c.titulo}</strong>
                <p>{c.conteudo}</p>
                <span className="dash-feed-time">{tempoRelativo(c.criado_em)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && itens.length === 0 && (
        <EmptyState
          icon="📭"
          titulo="Nenhum comunicado"
          descricao={tipo ? "Não há comunicados deste tipo no momento." : "Novos avisos aparecerão aqui."}
        />
      )}
    </div>
  );
}
