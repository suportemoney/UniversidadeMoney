import { useEffect, useState } from "react";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getRanking } from "../services/api";

const MEDALHAS = ["🥇", "🥈", "🥉"];

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRanking(50)
      .then(setRanking)
      .finally(() => setLoading(false));
  }, []);

  const podium = ranking.slice(0, 3);
  const resto = ranking.slice(3);

  return (
    <div className="dash-page">
      <PageHeader
        icon="🏆"
        titulo="Ranking de evolução"
        subtitulo="Colaboradores com mais horas de treinamento na plataforma."
      />

      {loading && <PageSkeleton cards={3} />}

      {!loading && ranking.length > 0 && (
        <>
          {podium.length >= 2 && (
            <div className="dash-podium">
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((r, idx) => {
                const posReal = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const item = idx === 0 ? podium[1] : idx === 1 ? podium[0] : podium[2];
                if (!item) return null;
                return (
                  <div
                    key={item.nome}
                    className={`dash-podium-item dash-podium-item--${posReal}`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <span className="dash-podium-medal">{MEDALHAS[posReal - 1]}</span>
                    <span className="dash-avatar">{item.nome.charAt(0)}</span>
                    <strong>{item.nome}</strong>
                    <span className="dash-podium-pos">{posReal}º lugar</span>
                    <strong style={{ color: "var(--navy)" }}>{item.horas}h</strong>
                  </div>
                );
              })}
            </div>
          )}

          <div className="dash-ranking-list">
            {(podium.length < 2 ? ranking : resto).map((r, i) => {
              const pos = podium.length < 2 ? i + 1 : i + 4;
              return (
                <div
                  key={r.nome}
                  className="dash-ranking-row"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="dash-rank-pos">{pos}</span>
                  <span className="dash-avatar dash-avatar-sm">{r.nome.charAt(0)}</span>
                  <span className="dash-rank-name">{r.nome}</span>
                  <span className="dash-ranking-horas">{r.horas}h</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && ranking.length === 0 && (
        <EmptyState
          icon="🏆"
          titulo="Ranking vazio"
          descricao="Complete cursos para acumular horas e aparecer no ranking."
        />
      )}
    </div>
  );
}
