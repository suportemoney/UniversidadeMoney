import { useEffect, useState } from "react";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getAoVivo } from "../services/api";
import { iconeAoVivo, labelLinkAoVivo } from "../utils/aoVivo";

function formatData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return {
    dia: d.toLocaleDateString("pt-BR", { day: "2-digit" }),
    mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
    completo: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

export default function AoVivoPage() {
  const [treinos, setTreinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setLoading(true);
    getAoVivo()
      .then(setTreinos)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-page">
      <PageHeader
        icon="🎥"
        titulo="Treinamentos ao vivo"
        subtitulo="Acesse as transmissões pelo Google Meet ou YouTube Live."
      />

      {erro && <div className="alert alert-error">{erro}</div>}
      {loading && <PageSkeleton cards={2} />}

      {!loading && treinos.length > 0 && (
        <div className="dash-card-grid dash-card-grid--wide">
          {treinos.map((t, i) => {
            const data = formatData(t.data);
            return (
              <article
                key={t.id}
                className="dash-card dash-live-card"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="dash-live-badge">
                  <span className="dash-live-dot" />
                  {t.tipo_plataforma === "youtube" ? "YouTube Live" : "Google Meet"}
                </span>
                <div className="dash-live-date-lg">
                  <div className="dash-live-date">
                    <strong>{data.dia}</strong>
                    <small>{data.mes}</small>
                  </div>
                  <div>
                    <span className="dash-card-meta">{data.completo}</span>
                    <br />
                    <strong style={{ color: "var(--navy)" }}>{t.hora}</strong>
                  </div>
                </div>
                <h3>{t.titulo}</h3>
                {t.setor && <span className="dash-tag">{t.setor}</span>}
                {t.descricao && <p className="dash-card-meta">{t.descricao}</p>}
                <div className="dash-card-footer">
                  {t.link ? (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      {iconeAoVivo(t.tipo_plataforma)} {labelLinkAoVivo(t.tipo_plataforma)}
                    </a>
                  ) : (
                    <span className="dash-card-meta">Link em breve</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && treinos.length === 0 && (
        <EmptyState
          icon="📅"
          titulo="Nenhum treinamento agendado"
          descricao="Fique de olho — novos eventos ao vivo aparecerão aqui."
        />
      )}
    </div>
  );
}
