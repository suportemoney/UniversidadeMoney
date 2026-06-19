import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getTrilha, matricularCurso } from "../services/api";

export default function TrilhaDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trilha, setTrilha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getTrilha(id)
      .then(setTrilha)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const continuar = async (cursoId) => {
    try {
      await matricularCurso(cursoId);
      navigate(`/dashboard/cursos/${cursoId}`);
    } catch (e) {
      setErro(e.message);
    }
  };

  const progressoGeral = trilha?.cursos?.length
    ? Math.round(trilha.cursos.reduce((a, c) => a + c.progresso, 0) / trilha.cursos.length)
    : 0;

  if (erro && !trilha) return <div className="alert alert-error">{erro}</div>;
  if (loading) return <div className="dash-page"><PageSkeleton cards={3} /></div>;

  return (
    <div className="dash-page">
      <Link to="/dashboard/trilhas" className="btn btn-outline btn-sm">← Voltar às trilhas</Link>

      <PageHeader
        icon="🎯"
        titulo={trilha.titulo}
        subtitulo={trilha.descricao || "Siga a ordem dos cursos para completar esta trilha."}
      >
        <div className="dash-stat-card" style={{ padding: "0.5rem 1rem", minWidth: 120 }}>
          <span className="dash-stat-label">Progresso geral</span>
          <strong>{progressoGeral}%</strong>
        </div>
      </PageHeader>

      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="dash-timeline">
        {trilha.cursos.map((c, i) => (
          <div
            key={c.id}
            className="dash-timeline-item"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className={`dash-timeline-step${c.progresso >= 100 ? " dash-timeline-step--done" : ""}`}>
              {c.progresso >= 100 ? "✓" : i + 1}
            </span>
            <div className="dash-timeline-content">
              <strong>{c.titulo}</strong>
              <div className="dash-progress">
                <div className="dash-progress-bar" style={{ width: `${c.progresso}%` }} />
              </div>
              <small className="dash-card-meta">
                {c.progresso}% — {c.matriculado ? "Em andamento" : "Não iniciado"}
              </small>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => continuar(c.id)}>
              {c.progresso > 0 ? "Continuar" : "Matricular"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
