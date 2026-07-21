import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CursoDescobertaAside from "../components/dashboard/CursoDescobertaAside";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getCursoDetalhe, matricularCurso } from "../services/api";

function metaModulo(m) {
  const aulas = m.total_aulas || 0;
  const min = m.duracao_minutos || 0;
  if (min > 0) return `${aulas} aula${aulas === 1 ? "" : "s"} · ${min} min`;
  return `${aulas} aula${aulas === 1 ? "" : "s"}`;
}

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

  const ctaLabel = inscrevendo
    ? "Carregando..."
    : curso.matriculado
      ? curso.progresso > 0
        ? "Continuar curso"
        : "Acessar curso"
      : "Matricular-se neste curso";

  const materiais = curso.materiais || [];
  const passos = curso.modulos.length + (materiais.length ? 1 : 0) + 1;

  return (
    <div className="dash-page dash-curso-shell">
      <div className="dash-curso-detalhe">
      <nav className="dash-curso-nav">
        <Link to="/dashboard/explorar" className="dash-curso-back">
          <span aria-hidden>←</span> Explorar cursos
        </Link>
      </nav>

      <header className="dash-curso-hero">
        <div className="dash-curso-hero-media">
          {curso.thumbnail_url ? (
            <img src={curso.thumbnail_url} alt="" className="dash-curso-hero-img" />
          ) : (
            <div className="dash-curso-hero-placeholder" aria-hidden>
              <span className="dash-curso-hero-mark">UM</span>
            </div>
          )}
          {curso.is_novo && <span className="dash-curso-hero-badge">Novo</span>}
        </div>

        <div className="dash-curso-hero-body">
          <div className="dash-curso-hero-topline">
            {curso.setor && <span className="dash-curso-pill">{curso.setor}</span>}
            {curso.tags?.map((t) => (
              <span key={t.id} className="dash-curso-pill dash-curso-pill--muted">{t.nome}</span>
            ))}
          </div>

          <h1>{curso.titulo}</h1>

          {curso.instrutor_nome && (
            <p className="dash-curso-instrutor">
              Com <strong>{curso.instrutor_nome}</strong>
            </p>
          )}

          <ul className="dash-curso-stats" aria-label="Resumo do curso">
            <li>
              <strong>{curso.total_modulos || curso.modulos.length}</strong>
              <span>módulos</span>
            </li>
            <li>
              <strong>{passos}</strong>
              <span>etapas</span>
            </li>
            <li>
              <strong>{Number(curso.duracao_horas) > 0 ? `${curso.duracao_horas}h` : "—"}</strong>
              <span>duração</span>
            </li>
            {curso.matriculado && (
              <li>
                <strong>{curso.progresso}%</strong>
                <span>progresso</span>
              </li>
            )}
          </ul>

          <p className="dash-curso-hint">
            Pode ser feito individualmente — não precisa concluir uma trilha inteira.
          </p>

          {erro && <div className="alert alert-error">{erro}</div>}

          <div className="dash-curso-cta-row">
            <button
              type="button"
              className="btn btn-primary dash-curso-cta"
              onClick={acao}
              disabled={inscrevendo}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </header>

      {curso.descricao && (
        <section className="dash-curso-sobre" aria-labelledby="curso-sobre-titulo">
          <div className="dash-curso-sobre-head">
            <span className="dash-curso-sobre-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <div>
              <h2 id="curso-sobre-titulo">Sobre o curso</h2>
              <p>O que você vai encontrar nesta jornada</p>
            </div>
          </div>
          <div className="dash-curso-sobre-body">
            <p>{curso.descricao}</p>
          </div>
          {curso.participantes?.length > 0 && (
            <div className="dash-curso-participantes">
              <span className="dash-curso-participantes-label">Participantes</span>
              <div className="dash-curso-participantes-list">
                {curso.participantes.map((p) => (
                  <span key={p.id} className="dash-curso-pill dash-curso-pill--muted">
                    {p.nome}{p.cargo ? ` · ${p.cargo}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="dash-curso-jornada" aria-labelledby="curso-jornada-titulo">
        <div className="dash-curso-jornada-head">
          <h2 id="curso-jornada-titulo">Conteúdo do curso</h2>
          <p>{passos} etapa{passos === 1 ? "" : "s"} até o certificado</p>
        </div>

        <ol className="dash-curso-path">
          {materiais.length > 0 && (
            <li className="dash-curso-path-item dash-curso-path-item--material">
              <span className="dash-curso-path-num" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <div className="dash-curso-path-body">
                <strong>Material de apoio</strong>
                <span>{materiais.length} PDF{materiais.length === 1 ? "" : "s"} para consulta</span>
                <ul className="dash-curso-path-files">
                  {materiais.map((m) => (
                    <li key={m.id}>{m.titulo}</li>
                  ))}
                </ul>
              </div>
            </li>
          )}

          {curso.modulos.map((m, i) => (
            <li
              key={m.id}
              className="dash-curso-path-item"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="dash-curso-path-num">{i + 1}</span>
              <div className="dash-curso-path-body">
                <strong>{m.titulo}</strong>
                <span>Videoaulas · {metaModulo(m)}</span>
              </div>
              <span className="dash-curso-path-tag">Módulo</span>
            </li>
          ))}

          <li className="dash-curso-path-item dash-curso-path-item--prova">
            <span className="dash-curso-path-num" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
              </svg>
            </span>
            <div className="dash-curso-path-body">
              <strong>Prova final</strong>
              <span>Nota final = (prova + média das atividades) / 2 · certificado a partir de 70%</span>
            </div>
            <span className="dash-curso-path-tag dash-curso-path-tag--accent">Avaliação</span>
          </li>

          {curso.modulos.length === 0 && (
            <li className="dash-curso-path-empty">Conteúdo em preparação.</li>
          )}
        </ol>
      </section>

      {curso.trilhas?.length > 0 && (
        <section className="dash-curso-trilhas">
          <h2>Também nas trilhas</h2>
          <p>Opcional — faça só este curso ou siga a trilha completa depois.</p>
          <div className="dash-chips">
            {curso.trilhas.map((t) => (
              <Link key={t.id} to={`/dashboard/trilhas/${t.id}`} className="dash-chip">
                {t.titulo}
              </Link>
            ))}
          </div>
        </section>
      )}
      </div>

      <CursoDescobertaAside
        excludeCursoId={curso.id}
        setorPreferido={curso.setor}
      />
    </div>
  );
}
