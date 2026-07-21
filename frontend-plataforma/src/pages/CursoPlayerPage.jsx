import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import VideoPlayerControlado from "../components/dashboard/VideoPlayerControlado";
import { apiFetch } from "../services/api";

function formatTimer(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CursoPlayerPage() {
  const { cursoId } = useParams();
  const [data, setData] = useState(null);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [materialAtual, setMaterialAtual] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [prova, setProva] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [tempoRestante, setTempoRestante] = useState(null);
  const [iniciou, setIniciou] = useState(false);

  const limparConteudo = () => {
    setAulaAtual(null);
    setMaterialAtual(null);
    setAtividade(null);
    setProva(null);
    setResultado(null);
    setTempoRestante(null);
  };

  const carregar = () => {
    apiFetch(`/cursos/${cursoId}/conteudo/`).then(setData);
  };

  useEffect(() => {
    setIniciou(false);
    carregar();
  }, [cursoId]);

  // Abre a primeira aula liberada ainda não concluída
  useEffect(() => {
    if (!data || iniciou) return;
    const aulas = data.modulos?.flatMap((m) => m.aulas || []) || [];
    const proxima =
      aulas.find((a) => a.liberada !== false && !a.concluida) ||
      aulas.find((a) => a.liberada !== false) ||
      aulas[0];
    if (proxima && proxima.liberada !== false) {
      setAulaAtual(proxima);
    } else if (data.materiais?.length) {
      setMaterialAtual(data.materiais[0]);
    }
    setIniciou(true);
  }, [data, iniciou]);

  // Mantém a aula aberta sincronizada após recarregar conteúdo
  useEffect(() => {
    if (!data || !aulaAtual) return;
    for (const mod of data.modulos || []) {
      const atualizada = mod.aulas?.find((a) => a.id === aulaAtual.id);
      if (
        atualizada &&
        (atualizada.concluida !== aulaAtual.concluida ||
          atualizada.percentual_assistido !== aulaAtual.percentual_assistido ||
          atualizada.liberada !== aulaAtual.liberada ||
          atualizada.video_url !== aulaAtual.video_url)
      ) {
        setAulaAtual(atualizada);
        break;
      }
    }
  }, [data]);

  useEffect(() => {
    if (!prova?.tempo_limite_min || tempoRestante === null) return;
    if (tempoRestante <= 0) {
      setErro("Tempo esgotado. Envie a prova ou perderá a tentativa.");
      return;
    }
    const t = setInterval(() => setTempoRestante((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [prova, tempoRestante]);

  const recomputeLiberacao = (modulos) => {
    const aulas = (modulos || []).flatMap((m) => m.aulas || []);
    let anteriorOk = true;
    const liberadaPorId = {};
    for (const a of aulas) {
      liberadaPorId[a.id] = anteriorOk;
      anteriorOk = !!a.concluida;
    }
    const videosOk = aulas.every((a) => a.concluida);
    return {
      modulos: (modulos || []).map((mod) => ({
        ...mod,
        aulas: (mod.aulas || []).map((a) => ({
          ...a,
          liberada: liberadaPorId[a.id] !== false,
        })),
        atividade: mod.atividade
          ? { ...mod.atividade, liberada: videosOk }
          : null,
      })),
      atividade_liberada: videosOk,
    };
  };

  const onProgressoAula = (r) => {
    if (!r) return;
    setData((prev) => {
      if (!prev) return prev;
      let next = {
        ...prev,
        progresso: r.progresso_curso ?? prev.progresso,
        prova_liberada: r.prova_liberada ?? prev.prova_liberada,
        atividade_liberada: r.atividade_liberada ?? prev.atividade_liberada,
      };
      if (r.concluida && aulaAtual) {
        const modulosAtualizados = (prev.modulos || []).map((mod) => ({
          ...mod,
          aulas: (mod.aulas || []).map((a) =>
            a.id === aulaAtual.id
              ? {
                  ...a,
                  concluida: true,
                  percentual_assistido: 100,
                  segundos_assistidos: r.segundos_assistidos ?? a.segundos_assistidos,
                }
              : a
          ),
        }));
        const recomputed = recomputeLiberacao(modulosAtualizados);
        next = {
          ...next,
          ...recomputed,
          aulas_pendentes: (prev.aulas_pendentes || []).filter((p) => p.id !== aulaAtual.id),
        };
        if (r.atividade_liberada) next.atividade_liberada = true;
        if (r.prova_liberada) {
          next.prova_liberada = true;
          next.aulas_pendentes = [];
        }
        setAulaAtual((aa) =>
          aa && aa.id === aulaAtual.id
            ? { ...aa, concluida: true, percentual_assistido: 100, liberada: true }
            : aa
        );
      }
      return next;
    });
  };

  const abrirAula = (aula) => {
    if (aula.liberada === false) {
      setErro("Assista a videoaula anterior até o final para liberar esta aula.");
      return;
    }
    limparConteudo();
    setErro("");
    setAulaAtual(aula);
  };

  const abrirAtividade = async (id, liberada) => {
    if (liberada === false || (data && data.atividade_liberada === false)) {
      setErro("Assista todas as videoaulas antes da atividade.");
      return;
    }
    limparConteudo();
    setRespostas({});
    setErro("");
    try {
      const d = await apiFetch(`/atividades/${id}/`);
      setAtividade(d);
    } catch (e) {
      setErro(e.message);
      carregar();
    }
  };

  const enviarAtividade = async () => {
    const r = await apiFetch(`/atividades/${atividade.id}/`, {
      method: "POST",
      body: JSON.stringify({ respostas }),
    });
    setResultado(r);
    carregar();
  };

  const abrirProva = async () => {
    if (!data?.prova_final) return;
    if (!data.prova_liberada) {
      setErro("Assista todas as videoaulas e conclua as atividades antes da prova.");
      return;
    }
    limparConteudo();
    setRespostas({});
    setErro("");
    try {
      const p = await apiFetch(`/provas/${data.prova_final.id}/`);
      setProva(p);
      if (p.tempo_limite_min) {
        setTempoRestante(p.tempo_limite_min * 60);
      }
    } catch (e) {
      setErro(e.message);
      carregar();
    }
  };

  const enviarProva = async () => {
    if (prova?.tempo_limite_min && tempoRestante !== null && tempoRestante <= 0) {
      setErro("Tempo esgotado.");
      return;
    }
    const r = await apiFetch(`/provas/${prova.id}/`, {
      method: "POST",
      body: JSON.stringify({ respostas }),
    });
    setResultado(r);
    setTempoRestante(null);
    carregar();
  };

  if (!data) {
    return (
      <div className="dash-page dash-player">
        <PageSkeleton />
      </div>
    );
  }

  const temConteudo = aulaAtual || materialAtual || atividade || prova;
  const notas = data.notas || {};
  const progresso = Math.min(100, Math.max(0, Number(data.progresso) || 0));

  return (
    <div className="dash-page dash-player">
      <header className="dash-player-top">
        <div className="dash-player-top-main">
          <Link to="/dashboard/meus-cursos" className="dash-curso-back">
            <span aria-hidden>←</span> Meus cursos
          </Link>
          <h1>{data.curso.titulo}</h1>
          {(notas.nota_final != null || notas.nota_prova != null) && (
            <p className="dash-player-notas">
              Prova {notas.nota_prova ?? "—"}% · Atividades {notas.media_atividades ?? "—"}% ·
              Final {notas.nota_final ?? "—"}% (mín. {notas.nota_minima ?? 70}%)
            </p>
          )}
        </div>

        <div className="dash-player-top-aside">
          <div className="dash-player-progress" aria-label={`Progresso ${progresso}%`}>
            <div className="dash-player-progress-label">
              <span>Progresso</span>
              <strong>{progresso}%</strong>
            </div>
            <div className="dash-player-progress-track">
              <div className="dash-player-progress-fill" style={{ width: `${progresso}%` }} />
            </div>
          </div>
          {data.certificado && data.certificado_id && (
            <a
              href={`/api/certificados/${data.certificado_id}/download/`}
              className="btn btn-outline btn-sm"
            >
              Baixar certificado
            </a>
          )}
        </div>
      </header>

      {data.certificado && (
        <div className="dash-player-banner dash-player-banner--ok" role="status">
          Certificado disponível — você concluiu este curso.
        </div>
      )}
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="dash-player-grid">
        <aside className="dash-player-sidebar" aria-label="Conteúdo do curso">
          <p className="dash-player-sidebar-label">Navegação</p>

          {(data.materiais || []).length > 0 && (
            <div className="dash-player-group">
              <h2>Material de apoio</h2>
              {data.materiais.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`dash-player-nav${materialAtual?.id === m.id ? " is-active" : ""}`}
                  onClick={() => {
                    limparConteudo();
                    setMaterialAtual(m);
                  }}
                >
                  <span className="dash-player-nav-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>
                  <span className="dash-player-nav-text">
                    <strong>{m.titulo}</strong>
                    <small>PDF</small>
                  </span>
                </button>
              ))}
            </div>
          )}

          {data.modulos.map((mod, idx) => (
            <div key={mod.id} className="dash-player-group">
              <h2>
                <span className="dash-player-group-num">{idx + 1}</span>
                {mod.titulo}
              </h2>
              {mod.aulas?.map((aula) => {
                const locked = aula.liberada === false;
                return (
                <button
                  key={aula.id}
                  type="button"
                  className={`dash-player-nav${aulaAtual?.id === aula.id ? " is-active" : ""}${
                    aula.concluida ? " is-done" : ""
                  }${locked ? " is-locked" : ""}`}
                  onClick={() => abrirAula(aula)}
                  disabled={locked}
                  title={
                    locked
                      ? "Assista a aula anterior até o final"
                      : aula.concluida
                        ? "Rever aula"
                        : "Abrir videoaula"
                  }
                >
                  <span className="dash-player-nav-icon" aria-hidden>
                    {locked ? "🔒" : aula.concluida ? "✓" : "▶"}
                  </span>
                  <span className="dash-player-nav-text">
                    <strong>{aula.titulo}</strong>
                    <small>
                      {locked
                        ? "Bloqueada — conclua a anterior"
                        : aula.concluida
                          ? "Concluída"
                          : "Videoaula"}
                    </small>
                  </span>
                </button>
                );
              })}
              {mod.atividade && (
                <button
                  type="button"
                  className={`dash-player-nav dash-player-nav--ativ${
                    atividade?.id === mod.atividade.id ? " is-active" : ""
                  }${mod.atividade.concluida ? " is-done" : ""}${
                    mod.atividade.liberada === false || data.atividade_liberada === false
                      ? " is-locked"
                      : ""
                  }`}
                  onClick={() => abrirAtividade(mod.atividade.id, mod.atividade.liberada)}
                  disabled={mod.atividade.liberada === false || data.atividade_liberada === false}
                  title={
                    mod.atividade.liberada === false || data.atividade_liberada === false
                      ? "Assista todas as videoaulas para liberar"
                      : "Abrir atividade"
                  }
                >
                  <span className="dash-player-nav-icon" aria-hidden>
                    {mod.atividade.liberada === false || data.atividade_liberada === false
                      ? "🔒"
                      : mod.atividade.concluida
                        ? "✓"
                        : "✎"}
                  </span>
                  <span className="dash-player-nav-text">
                    <strong>{mod.atividade.titulo}</strong>
                    <small>
                      {mod.atividade.liberada === false || data.atividade_liberada === false
                        ? "Bloqueada — termine as aulas"
                        : `Atividade${
                            mod.atividade.nota != null ? ` · ${mod.atividade.nota}%` : ""
                          }`}
                    </small>
                  </span>
                </button>
              )}
            </div>
          ))}

          {data.prova_final && (
            <button
              type="button"
              className={`dash-player-nav dash-player-nav--prova${prova ? " is-active" : ""}${
                !data.prova_liberada ? " is-locked" : ""
              }`}
              onClick={abrirProva}
              disabled={!data.prova_liberada}
              title={
                data.prova_liberada
                  ? "Abrir prova final"
                  : "Conclua todas as aulas e atividades para liberar"
              }
            >
              <span className="dash-player-nav-icon" aria-hidden>
                {data.prova_liberada ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9" />
                  </svg>
                ) : (
                  "🔒"
                )}
              </span>
              <span className="dash-player-nav-text">
                <strong>Prova final</strong>
                <small>
                  {data.prova_liberada
                    ? `Avaliação${
                        data.prova_final.nota != null ? ` · ${data.prova_final.nota}%` : ""
                      }`
                    : "Bloqueada — aulas e atividades"}
                </small>
              </span>
            </button>
          )}
        </aside>

        <main className="dash-player-main">
          {materialAtual && (
            <section className="dash-player-panel">
              <div className="dash-player-panel-head">
                <div>
                  <h2>{materialAtual.titulo}</h2>
                  <p>Material de apoio</p>
                </div>
              </div>
              {materialAtual.arquivo_url ? (
                <iframe
                  title={materialAtual.titulo}
                  src={materialAtual.arquivo_url}
                  className="dash-player-pdf"
                />
              ) : (
                <p className="dash-player-empty-msg">Arquivo indisponível.</p>
              )}
            </section>
          )}

          {aulaAtual && (
            <section className="dash-player-panel">
              <div className="dash-player-panel-head">
                <div>
                  <h2>{aulaAtual.titulo}</h2>
                  <p>{aulaAtual.concluida ? "Aula concluída" : "Videoaula — assista até o final"}</p>
                </div>
              </div>
              <VideoPlayerControlado
                key={aulaAtual.id}
                aulaId={aulaAtual.id}
                src={aulaAtual.video_url}
                concluidaInicial={!!aulaAtual.concluida}
                percentualInicial={aulaAtual.percentual_assistido || 0}
                onProgresso={onProgressoAula}
              />
            </section>
          )}

          {atividade && (
            <section className="dash-player-panel">
              <div className="dash-player-panel-head">
                <div>
                  <h2>{atividade.titulo}</h2>
                  <p>Atividade do módulo</p>
                </div>
              </div>
              <div className="dash-player-quiz">
                {atividade.questoes.map((q, qi) => (
                  <div key={q.id} className="dash-player-questao">
                    <p className="dash-player-questao-enunciado">
                      <span className="dash-player-questao-n">{qi + 1}</span>
                      {q.enunciado}
                    </p>
                    {q.tipo === "verdadeiro_falso" ? (
                      <select
                        className="dash-player-select"
                        value={respostas[q.id] || ""}
                        onChange={(e) => setRespostas({ ...respostas, [q.id]: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        <option value="Verdadeiro">Verdadeiro</option>
                        <option value="Falso">Falso</option>
                      </select>
                    ) : (
                      <div className="dash-player-opcoes">
                        {q.opcoes.map((op, i) => (
                          <label key={i} className="dash-player-opcao">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={respostas[q.id] === i}
                              onChange={() => setRespostas({ ...respostas, [q.id]: i })}
                            />
                            <span>{op}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-primary" onClick={enviarAtividade}>
                  Enviar atividade
                </button>
              </div>
            </section>
          )}

          {prova && (
            <section className="dash-player-panel">
              <div className="dash-player-panel-head">
                <div>
                  <h2>{prova.titulo}</h2>
                  <p>
                    Nota final = (prova + média das atividades) / 2 · certificado ≥{" "}
                    {data.notas?.nota_minima ?? 70}%
                  </p>
                </div>
                <div className="dash-player-prova-meta">
                  <span className="dash-player-pill">
                    Tentativas: {prova.tentativas_restantes}
                  </span>
                  {tempoRestante !== null && (
                    <span
                      className={`dash-player-timer${
                        tempoRestante < 60 ? " dash-player-timer--urgente" : ""
                      }`}
                    >
                      {formatTimer(tempoRestante)}
                    </span>
                  )}
                </div>
              </div>
              <div className="dash-player-quiz">
                {prova.questoes.map((q, qi) => (
                  <div key={q.id} className="dash-player-questao">
                    <p className="dash-player-questao-enunciado">
                      <span className="dash-player-questao-n">{qi + 1}</span>
                      {q.enunciado}
                    </p>
                    <div className="dash-player-opcoes">
                      {q.opcoes.map((op, i) => (
                        <label key={i} className="dash-player-opcao">
                          <input
                            type="radio"
                            name={`pq-${q.id}`}
                            checked={respostas[q.id] === i}
                            onChange={() => setRespostas({ ...respostas, [q.id]: i })}
                          />
                          <span>{op}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-primary" onClick={enviarProva}>
                  Enviar prova
                </button>
              </div>
            </section>
          )}

          {resultado && (
            <div className="dash-player-banner dash-player-banner--ok" role="status">
              {resultado.nota_final != null ? (
                <>
                  Prova {resultado.nota_prova ?? resultado.nota}% · Atividades{" "}
                  {resultado.media_atividades}% · Final {resultado.nota_final}% —
                  {resultado.certificado
                    ? " certificado liberado!"
                    : " abaixo do mínimo — tente de novo se houver tentativas."}
                </>
              ) : (
                <>
                  Nota: {resultado.nota}% — {resultado.aprovado ? "Aprovado!" : "Não aprovado."}
                </>
              )}
            </div>
          )}

          {!temConteudo && (
            <div className="dash-player-empty">
              <p>Selecione um item na navegação para começar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
