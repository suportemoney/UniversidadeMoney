import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDashboard, matricularCurso } from "../services/api";
import { labelLinkAoVivo } from "../utils/aoVivo";

function formatData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "").toUpperCase();
}

function tempoRelativo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const horas = Math.floor(diff / 3600000);
  if (horas < 1) return "Agora há pouco";
  if (horas < 24) return `Há ${horas} hora${horas > 1 ? "s" : ""}`;
  const dias = Math.floor(horas / 24);
  return `Há ${dias} dia${dias > 1 ? "s" : ""}`;
}

const ICON_COMUNICADO = { info: "ℹ️", trofeu: "🏆", megafone: "📣" };

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    setLoading(true);
    getDashboard()
      .then(setData)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleContinuar = async (cursoId) => {
    try {
      await matricularCurso(cursoId);
      navigate(`/dashboard/cursos/${cursoId}`);
    } catch (e) {
      setErro(e.message);
    }
  };

  if (loading) {
    return <div className="dash-loading">Carregando painel...</div>;
  }

  if (erro && !data) {
    return <div className="alert alert-error">{erro}</div>;
  }

  if (!data) return null;

  const { usuario } = data;
  // Só cursos com progresso real — evita grade morta a 0%
  const emAndamento = (data.continue_aprendendo || []).filter(
    (c) => Number(c.progresso) > 0,
  );
  const comunicados = (data.comunicados || []).slice(0, 3);
  const aoVivo = data.treinamentos_ao_vivo || [];
  const trilhas = data.trilhas_setor || [];

  return (
    <div className="dash-home">
      {erro && <div className="alert alert-error">{erro}</div>}

      <section className="dash-home-hero">
        <div className="dash-home-hero__inner">
          <p className="dash-home-hero__brand">Money Promotora</p>
          <h1>Olá, {usuario.nome || "Colaborador"}</h1>
          <p className="dash-home-hero__lead">
            Continue de onde parou ou explore novos treinamentos da equipe.
          </p>
          <Link to="/dashboard/explorar" className="btn btn-success">
            Explorar cursos
          </Link>
        </div>
      </section>

      <section className="dash-section dash-section--primary dash-home-animate">
        <div className="dash-section-head">
          <h2>Continue aprendendo</h2>
          <p>Retome os cursos em que você já avançou.</p>
        </div>

        {emAndamento.length === 0 ? (
          <div className="dash-home-empty">
            <p>Nenhum curso em andamento ainda.</p>
            <Link to="/dashboard/explorar" className="btn btn-primary btn-sm">
              Começar a explorar
            </Link>
          </div>
        ) : (
          <div className="dash-scroll-row dash-scroll-row--courses">
            {emAndamento.map((curso) => (
              <article key={curso.id} className="dash-course-card dash-course-card--home">
                <h3>{curso.titulo}</h3>
                {curso.setor && <span className="dash-tag">{curso.setor}</span>}
                <div className="dash-progress">
                  <div className="dash-progress-bar" style={{ width: `${curso.progresso}%` }} />
                </div>
                <span className="dash-progress-text">{curso.progresso}% concluído</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleContinuar(curso.id)}
                >
                  Continuar
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dash-section dash-home-animate dash-home-animate--delay">
        <div className="dash-section-head">
          <h2>Trilhas por setor</h2>
          <p>Acesse a trilha do seu time.</p>
        </div>
        <div className="dash-trilhas-strip" role="list">
          {trilhas.map((t) => (
            <Link
              key={t.slug}
              to="/dashboard/trilhas"
              className="dash-trilha-chip"
              role="listitem"
            >
              <span className="dash-trilha-chip__icon" aria-hidden="true">
                {t.icone}
              </span>
              <span className="dash-trilha-chip__text">
                <strong>{t.nome}</strong>
                <small>
                  {t.total_cursos} curso{t.total_cursos === 1 ? "" : "s"}
                </small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="dash-home-secondary dash-home-animate dash-home-animate--delay2">
        <section className="dash-panel dash-panel--home">
          <div className="dash-section-head">
            <h2>Ao vivo</h2>
            <p>Próximos treinamentos ao vivo.</p>
          </div>
          {aoVivo.length === 0 ? (
            <p className="dash-home-panel-empty">Nenhum evento agendado.</p>
          ) : (
            <ul className="dash-list dash-list--home">
              {aoVivo.map((t) => (
                <li key={t.id} className="dash-list-item dash-live-item">
                  <div className="dash-live-date">
                    <strong>{formatData(t.data)}</strong>
                    <small>{t.hora}</small>
                  </div>
                  <div className="dash-live-item__body">
                    <strong>{t.titulo}</strong>
                    <small>{t.setor}</small>
                  </div>
                  {t.link ? (
                    <a
                      href={t.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      {labelLinkAoVivo(t.tipo_plataforma)}
                    </a>
                  ) : (
                    <Link to="/dashboard/ao-vivo" className="btn btn-outline btn-sm">
                      Detalhes
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-panel dash-panel--home">
          <div className="dash-section-head">
            <h2>Comunicados</h2>
            <p>Avisos internos recentes.</p>
          </div>
          {comunicados.length === 0 ? (
            <p className="dash-home-panel-empty">Nenhum comunicado no momento.</p>
          ) : (
            <ul className="dash-list dash-list--home">
              {comunicados.map((c) => (
                <li key={c.id} className="dash-list-item dash-comunicado-item">
                  <span className="dash-comunicado-item__icon" aria-hidden="true">
                    {ICON_COMUNICADO[c.tipo] || "ℹ️"}
                  </span>
                  <div>
                    <strong>{c.titulo}</strong>
                    <p>{c.conteudo}</p>
                    <small>{tempoRelativo(c.criado_em)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
