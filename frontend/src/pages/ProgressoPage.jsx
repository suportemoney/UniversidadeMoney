import { useEffect, useState } from "react";
import PageHeader, { AnimatedNumber } from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import EmptyState from "../components/dashboard/EmptyState";
import { getProgresso } from "../services/api";

const STAT_ICONS = ["⏱️", "📚", "✅", "🏅"];

export default function ProgressoPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgresso()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const stats = data ? [
    { label: "Horas totais", value: data.horas_totais, suffix: "h", decimals: 1, highlight: true },
    { label: "Em andamento", value: data.em_andamento, suffix: "" },
    { label: "Concluídos", value: data.concluidos, suffix: "" },
    { label: "Certificados", value: data.certificados, suffix: "" },
  ] : [];

  const maxHoras = data ? Math.max(...data.por_setor.map((s) => s.horas), 1) : 1;

  return (
    <div className="dash-page">
      <PageHeader
        icon="📈"
        titulo="Meu progresso"
        subtitulo="Visão detalhada das suas horas e metas de treinamento."
      />

      {loading && <PageSkeleton tipo="stats" />}

      {!loading && data && (
        <>
          <div className="dash-stats-row">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`dash-stat-card${s.highlight ? " dash-stat-card--highlight" : ""}`}
                style={{ animationDelay: `${i * 80}ms`, animation: "dashCardIn 0.45s ease backwards" }}
              >
                <span className="dash-stat-card--icon">{STAT_ICONS[i]}</span>
                <span className="dash-stat-label">{s.label}</span>
                <strong>
                  <AnimatedNumber value={s.value} suffix={s.suffix} decimals={s.decimals || 0} />
                </strong>
              </div>
            ))}
          </div>

          <section className="dash-section">
            <h2>Progresso por setor</h2>
            {data.por_setor.length > 0 ? (
              <div className="dash-setor-bars">
                {data.por_setor.map((s, i) => (
                  <div
                    key={s.setor}
                    className="dash-setor-bar-item"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div className="dash-progress-setor-header">
                      <strong>{s.setor}</strong>
                      <small>{s.concluidos}/{s.total} cursos · {s.horas.toFixed(1)}h</small>
                    </div>
                    <div className="dash-progress">
                      <div
                        className="dash-progress-bar"
                        style={{ width: `${(s.horas / maxHoras) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📊"
                titulo="Sem dados ainda"
                descricao="Matricule-se em um curso para começar a acompanhar seu progresso."
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
