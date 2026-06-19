import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getCursoDetalhe, matricularCurso } from "../services/api";

export default function CursoDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [inscrevendo, setInscrevendo] = useState(false);

  useEffect(() => {
    getCursoDetalhe(id)
      .then(setCurso)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const acao = async () => {
    setInscrevendo(true);
    setErro("");
    try {
      if (!curso.matriculado) {
        await matricularCurso(curso.id);
      }
      navigate(`/dashboard/cursos/${curso.id}`);
    } catch (e) {
      setErro(e.message);
    } finally {
      setInscrevendo(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-page">
        <PageSkeleton cards={1} />
      </div>
    );
  }

  if (erro && !curso) return <div className="alert alert-error">{erro}</div>;
  if (!curso) return null;

  return (
    <div className="dash-page">
      <Link to="/dashboard/explorar" className="btn btn-outline btn-sm">← Explorar cursos</Link>

      <div className="dash-curso-hero">
        <div className="dash-curso-hero-media">
          {curso.thumbnail_url ? (
            <img src={curso.thumbnail_url} alt="" className="dash-curso-hero-img" />
          ) : (
            <div className="dash-curso-hero-placeholder">📚</div>
          )}
        </div>
        <div className="dash-curso-hero-body">
          {curso.is_novo && <span className="dash-badge-novo">Novo</span>}
          <h1>{curso.titulo}</h1>
          {curso.setor && <span className="dash-tag">{curso.setor}</span>}
          <p className="dash-curso-desc">{curso.descricao || "Curso disponível na Universidade Money."}</p>

          <div className="dash-curso-stats">
            <div><strong>{curso.total_modulos}</strong><small>módulos</small></div>
            <div><strong>{curso.duracao_horas}h</strong><small>duração</small></div>
            {curso.matriculado && (
              <div><strong>{curso.progresso}%</strong><small>seu progresso</small></div>
            )}
          </div>

          <div className="dash-curso-aviso">
            💡 Este curso pode ser feito <strong>individualmente</strong>, sem precisar completar a trilha inteira.
          </div>

          {erro && <div className="alert alert-error">{erro}</div>}

          <button
            type="button"
            className="btn btn-primary"
            onClick={acao}
            disabled={inscrevendo}
          >
            {inscrevendo
              ? "Carregando..."
              : curso.matriculado
                ? curso.progresso > 0
                  ? "Continuar curso"
                  : "Acessar curso"
                : "Matricular-se neste curso"}
          </button>
        </div>
      </div>

      <section className="dash-section">
        <h2>Conteúdo do curso</h2>
        <div className="dash-timeline">
          {curso.modulos.map((m, i) => (
            <div key={m.id} className="dash-timeline-item" style={{ animationDelay: `${i * 50}ms` }}>
              <span className="dash-timeline-step">{i + 1}</span>
              <div className="dash-timeline-content">
                <strong>{m.titulo}</strong>
                <small className="dash-card-meta">
                  {m.total_aulas} aula(s) · {m.duracao_minutos || 0} min
                </small>
              </div>
            </div>
          ))}
          {curso.modulos.length === 0 && (
            <p className="dash-card-meta">Conteúdo em preparação.</p>
          )}
        </div>
      </section>

      {curso.trilhas?.length > 0 && (
        <section className="dash-section">
          <h2>Também faz parte das trilhas</h2>
          <p className="dash-card-meta" style={{ marginBottom: "0.75rem" }}>
            Opcional — você pode fazer só este curso ou seguir a trilha completa depois.
          </p>
          <div className="dash-chips">
            {curso.trilhas.map((t) => (
              <Link key={t.id} to={`/dashboard/trilhas/${t.id}`} className="dash-chip">
                🛤️ {t.titulo}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
