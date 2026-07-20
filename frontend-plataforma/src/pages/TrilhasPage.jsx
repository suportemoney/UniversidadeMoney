import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getTrilhas } from "../services/api";

const ICONES_SETOR = ["🛤️", "📊", "💼", "🎯", "🚀", "📈"];

export default function TrilhasPage() {
  const [trilhas, setTrilhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getTrilhas()
      .then(setTrilhas)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-page">
      <PageHeader
        icon="🛤️"
        titulo="Trilhas de aprendizado"
        subtitulo="Percursos organizados por setor e carreira na Money Promotora."
      />

      {erro && <div className="alert alert-error">{erro}</div>}
      {loading && <PageSkeleton cards={3} />}

      {!loading && trilhas.length > 0 && (
        <div className="dash-card-grid">
          {trilhas.map((t, i) => (
            <Link
              key={t.id}
              to={`/dashboard/trilhas/${t.id}`}
              className="dash-card dash-card--clickable dash-trilha-card-v2"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="dash-card-icon dash-card-icon--blue">
                {ICONES_SETOR[i % ICONES_SETOR.length]}
              </span>
              <h3>{t.titulo}</h3>
              {t.setor && <span className="dash-tag">{t.setor}</span>}
              <span className="dash-card-meta">{t.total_cursos} cursos na trilha</span>
              <div className="dash-trilha-progress-label">
                <span>Progresso</span>
                <strong>{t.progresso}%</strong>
              </div>
              <div className="dash-progress">
                <div className="dash-progress-bar" style={{ width: `${t.progresso}%` }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && trilhas.length === 0 && !erro && (
        <EmptyState
          icon="🛤️"
          titulo="Nenhuma trilha disponível"
          descricao="Novas trilhas serão publicadas em breve pela equipe de gestão."
        />
      )}
    </div>
  );
}
