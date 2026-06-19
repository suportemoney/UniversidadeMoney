import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Modal from "../components/ui/Modal";
import { getDashboard, inscreverAoVivo, matricularCurso } from "../services/api";

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
  const [inscricao, setInscricao] = useState(null);
  const [msg, setMsg] = useState("");

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

  const { usuario, stats } = data;

  return (
    <div className="dash-home">
      {erro && <div className="alert alert-error">{erro}</div>}

      <section className="dash-top-row">
        <div className="dash-welcome">
          <div>
            <h1>Bem-vindo(a), {usuario.nome || "Colaborador"}!</h1>
            <p>Sua plataforma de aprendizado corporativo da Money Promotora.</p>
            <Link to="/dashboard/explorar" className="btn btn-success">Explorar cursos</Link>
          </div>
          <div className="dash-welcome-art" aria-hidden="true">🎓</div>
        </div>

        <div className="dash-stats">
          <div className="dash-stat-card">
            <span className="dash-stat-label">Cursos disponíveis</span>
            <strong>{stats.cursos_disponiveis}</strong>
            <small>+{stats.cursos_novos_semana} esta semana</small>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Em andamento</span>
            <strong>{stats.em_andamento}</strong>
            <small>Cursos ativos</small>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Certificados</span>
            <strong>{stats.certificados}</strong>
            <small>Conquistados</small>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Horas de treinamento</span>
            <strong>{stats.horas_treinamento}h</strong>
            <small>Total acumulado</small>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Colaboradores ativos</span>
            <strong>{stats.colaboradores_ativos}</strong>
            <small>Na plataforma</small>
          </div>
        </div>
      </section>

      <section className="dash-section">
        <h2>Continue aprendendo</h2>
        <div className="dash-scroll-row">
          {data.continue_aprendendo.map((curso) => (
            <article key={curso.id} className="dash-course-card">
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
      </section>

      <section className="dash-section">
        <h2>Trilhas por setor</h2>
        <div className="dash-scroll-row dash-trilhas">
          {data.trilhas_setor.map((t) => (
            <Link key={t.slug} to="/dashboard/trilhas" className="dash-trilha-card dash-trilha-card--link">
              <span className="dash-trilha-icon">{t.icone}</span>
              <strong>{t.nome}</strong>
              <small>{t.total_cursos} cursos</small>
              <div className="dash-progress">
                <div className="dash-progress-bar" style={{ width: `${t.progresso}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="dash-grid-2">
        <section className="dash-panel">
          <h2>Novos treinamentos</h2>
          <ul className="dash-list">
            {data.novos_treinamentos.map((c) => (
              <li key={c.id} className="dash-list-item">
                <Link to={`/dashboard/curso/${c.id}`} className="dash-list-item-link">
                  <div>
                    <strong>{c.titulo}</strong>
                    <small>{c.modulos} módulos · {c.duracao_horas}h</small>
                  </div>
                  {c.is_novo && <span className="dash-badge-novo">Novo</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-panel">
          <h2>Próximos treinamentos ao vivo</h2>
          <ul className="dash-list">
            {data.treinamentos_ao_vivo.map((t) => (
              <li key={t.id} className="dash-list-item dash-live-item">
                <div className="dash-live-date">
                  <strong>{formatData(t.data)}</strong>
                  <small>{t.hora}</small>
                </div>
                <div>
                  <strong>{t.titulo}</strong>
                  <small>{t.setor}</small>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setInscricao(t)}>Inscrever-se</button>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-panel">
          <h2>Comunicados internos</h2>
          <ul className="dash-list">
            {data.comunicados.map((c) => (
              <li key={c.id} className="dash-list-item">
                <span>{ICON_COMUNICADO[c.tipo] || "ℹ️"}</span>
                <div>
                  <strong>{c.titulo}</strong>
                  <p>{c.conteudo}</p>
                  <small>{tempoRelativo(c.criado_em)}</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-panel">
          <h2>Ranking de evolução</h2>
          <ol className="dash-ranking">
            {data.ranking.length === 0 && (
              <li className="dash-ranking-empty">Complete cursos para aparecer no ranking.</li>
            )}
            {data.ranking.map((r, i) => (
              <li key={r.nome}>
                <span className="dash-rank-pos">{i + 1}</span>
                <span className="dash-avatar dash-avatar-sm">{r.nome.charAt(0)}</span>
                <span className="dash-rank-name">{r.nome}</span>
                <strong>{r.horas}h</strong>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="dash-conquistas-row">
        <div>
          <h2>Certificados e conquistas</h2>
          <div className="dash-conquistas">
            {data.conquistas.map((c) => (
              <div key={c.slug} className="dash-conquista-badge">
                <span>🏅</span>
                <small>{c.titulo}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-cert-summary">
          <strong>{data.total_certificados}</strong>
          <span>Certificados conquistados</span>
          <Link to="/dashboard/certificados">Ver todos os certificados</Link>
        </div>
      </section>

      <Modal open={!!inscricao} onClose={() => setInscricao(null)} title="Confirmar inscrição">
        <p>Deseja se inscrever em <strong>{inscricao?.titulo}</strong>?</p>
        {msg && <div className="alert alert-success">{msg}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setInscricao(null)}>Cancelar</button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              try {
                await inscreverAoVivo(inscricao.id);
                setMsg("Inscrição confirmada!");
                setInscricao(null);
                carregar();
              } catch (e) {
                setErro(e.message);
              }
            }}
          >
            Confirmar
          </button>
        </div>
      </Modal>
    </div>
  );
}
