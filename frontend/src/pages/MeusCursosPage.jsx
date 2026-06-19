import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { apiFetch } from "../services/api";

export default function MeusCursosPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/meus-cursos/")
      .then(setCursos)
      .finally(() => setLoading(false));
  }, []);

  const emAndamento = cursos.filter((c) => !c.concluido).length;
  const concluidos = cursos.filter((c) => c.concluido).length;

  return (
    <div className="dash-page">
      <PageHeader
        icon="📚"
        titulo="Meus cursos"
        subtitulo="Continue de onde parou ou revise cursos já concluídos."
      >
        {!loading && cursos.length > 0 && (
          <>
            <div className="dash-stat-card">
              <span className="dash-stat-label">Ativos</span>
              <strong>{emAndamento}</strong>
            </div>
            <div className="dash-stat-card">
              <span className="dash-stat-label">Concluídos</span>
              <strong>{concluidos}</strong>
            </div>
          </>
        )}
      </PageHeader>

      {loading && <PageSkeleton cards={3} />}

      {!loading && cursos.length > 0 && (
        <div className="dash-card-grid">
          {cursos.map((c, i) => (
            <Link
              key={c.curso_id}
              to={`/dashboard/cursos/${c.curso_id}`}
              className="dash-card dash-card--clickable dash-curso-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={`dash-card-icon${c.concluido ? " dash-card-icon--gold" : " dash-card-icon--blue"}`}>
                {c.concluido ? "🏅" : "📖"}
              </span>
              <h3>{c.titulo}</h3>
              {c.setor && <span className="dash-tag">{c.setor}</span>}
              <div className="dash-trilha-progress-label">
                <span>Progresso</span>
                <strong>{c.progresso}%</strong>
              </div>
              <div className="dash-progress">
                <div className="dash-progress-bar" style={{ width: `${c.progresso}%` }} />
              </div>
              <div className="dash-card-footer">
                <span className="dash-card-meta">
                  {c.concluido ? "Curso concluído" : "Continuar aprendendo →"}
                </span>
                {c.concluido && <span className="dash-badge-inscrito">Certificado</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && cursos.length === 0 && (
        <EmptyState
          icon="📚"
          titulo="Nenhum curso matriculado"
          descricao="Explore o catálogo e comece sua jornada de aprendizado."
          acao={<Link to="/dashboard/explorar" className="btn btn-primary">Explorar cursos</Link>}
        />
      )}
    </div>
  );
}
