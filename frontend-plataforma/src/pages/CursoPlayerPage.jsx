import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import "../styles/gestao.css";

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
  const [mostrarDesc, setMostrarDesc] = useState(true);

  const limparConteudo = () => {
    setAulaAtual(null);
    setMaterialAtual(null);
    setAtividade(null);
    setProva(null);
    setResultado(null);
    setTempoRestante(null);
    setMostrarDesc(false);
  };

  const carregar = () => {
    apiFetch(`/cursos/${cursoId}/conteudo/`).then(setData);
  };

  useEffect(() => {
    carregar();
  }, [cursoId]);

  useEffect(() => {
    if (!prova?.tempo_limite_min || tempoRestante === null) return;
    if (tempoRestante <= 0) {
      setErro("Tempo esgotado. Envie a prova ou perderá a tentativa.");
      return;
    }
    const t = setInterval(() => setTempoRestante((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [prova, tempoRestante]);

  const concluirAula = async (aulaId) => {
    await apiFetch(`/aulas/${aulaId}/concluir/`, { method: "POST" });
    carregar();
  };

  const abrirAtividade = async (id) => {
    limparConteudo();
    setRespostas({});
    const d = await apiFetch(`/atividades/${id}/`);
    setAtividade(d);
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

  if (!data) return <p>Carregando curso...</p>;

  const temConteudo = mostrarDesc || aulaAtual || materialAtual || atividade || prova;
  const notas = data.notas || {};

  return (
    <div className="player">
      <div className="gestao-page-header">
        <h1>{data.curso.titulo}</h1>
        <Link to="/dashboard/meus-cursos" className="btn btn-outline btn-sm">← Meus cursos</Link>
      </div>
      <p>
        Progresso: {data.progresso}%
        {data.certificado && " — Certificado disponível!"}
      </p>
      {(notas.nota_final != null || notas.nota_prova != null) && (
        <p className="gestao-muted">
          Nota prova: {notas.nota_prova ?? "—"}% · Média atividades: {notas.media_atividades ?? "—"}% ·
          Nota final: {notas.nota_final ?? "—"}% (mín. {notas.nota_minima ?? 70}%)
        </p>
      )}
      {data.certificado && data.certificado_id && (
        <p>
          <a href={`/api/certificados/${data.certificado_id}/download/`} className="btn btn-outline btn-sm">
            Baixar certificado
          </a>
        </p>
      )}
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="player-grid">
        <aside className="player-sidebar">
          <button
            type="button"
            className={`player-item${mostrarDesc ? " player-item--ativ" : ""}`}
            onClick={() => { limparConteudo(); setMostrarDesc(true); }}
          >
            Descrição
          </button>

          {(data.materiais || []).length > 0 && (
            <div className="player-modulo">
              <h3>Material de apoio</h3>
              {data.materiais.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="player-item"
                  onClick={() => { limparConteudo(); setMaterialAtual(m); }}
                >
                  📎 {m.titulo}
                </button>
              ))}
            </div>
          )}

          {data.modulos.map((mod) => (
            <div key={mod.id} className="player-modulo">
              <h3>{mod.titulo}</h3>
              {mod.aulas?.map((aula) => (
                <button
                  key={aula.id}
                  type="button"
                  className={`player-item${aula.concluida ? " done" : ""}`}
                  onClick={() => { limparConteudo(); setAulaAtual(aula); }}
                >
                  {aula.concluida ? "✓" : "▶"} {aula.titulo}
                </button>
              ))}
              {mod.atividade && (
                <button
                  type="button"
                  className={`player-item player-item--ativ${mod.atividade.concluida ? " done" : ""}`}
                  onClick={() => abrirAtividade(mod.atividade.id)}
                >
                  {mod.atividade.concluida ? "✓" : "📝"} {mod.atividade.titulo}
                  {mod.atividade.nota != null ? ` (${mod.atividade.nota}%)` : ""}
                </button>
              )}
            </div>
          ))}

          {data.prova_final && (
            <button type="button" className="btn btn-primary btn-sm" onClick={abrirProva}>
              Prova final
              {data.prova_final.nota != null ? ` · ${data.prova_final.nota}%` : ""}
            </button>
          )}
        </aside>

        <main className="player-main">
          {mostrarDesc && (
            <div>
              <h2>Descrição</h2>
              <div className="player-texto-conteudo">
                {(data.descricao || data.curso?.descricao || "Sem descrição.")
                  .split("\n")
                  .map((linha, i) => (
                    <p key={i}>{linha || "\u00A0"}</p>
                  ))}
              </div>
            </div>
          )}

          {materialAtual && (
            <div>
              <h2>{materialAtual.titulo}</h2>
              {materialAtual.arquivo_url ? (
                <iframe title={materialAtual.titulo} src={materialAtual.arquivo_url} className="player-pdf" />
              ) : (
                <p>Arquivo indisponível.</p>
              )}
            </div>
          )}

          {aulaAtual && (
            <div>
              <h2>{aulaAtual.titulo}</h2>
              {aulaAtual.video_url ? (
                <video controls src={aulaAtual.video_url} className="gestao-video-preview" />
              ) : (
                <p>Vídeo indisponível.</p>
              )}
              {!aulaAtual.concluida && (
                <button type="button" className="btn btn-success" onClick={() => concluirAula(aulaAtual.id)}>
                  Marcar como concluída
                </button>
              )}
            </div>
          )}

          {atividade && (
            <div>
              <h2>{atividade.titulo}</h2>
              {atividade.questoes.map((q) => (
                <div key={q.id} className="gestao-questao">
                  <p>{q.enunciado}</p>
                  {q.tipo === "verdadeiro_falso" ? (
                    <select
                      value={respostas[q.id] || ""}
                      onChange={(e) => setRespostas({ ...respostas, [q.id]: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="Verdadeiro">Verdadeiro</option>
                      <option value="Falso">Falso</option>
                    </select>
                  ) : (
                    q.opcoes.map((op, i) => (
                      <label key={i} className="gestao-check">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={respostas[q.id] === i}
                          onChange={() => setRespostas({ ...respostas, [q.id]: i })}
                        />
                        {op}
                      </label>
                    ))
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-primary" onClick={enviarAtividade}>Enviar</button>
            </div>
          )}

          {prova && (
            <div>
              <h2>{prova.titulo}</h2>
              <p>
                A nota final = (nota da prova + média das atividades) / 2.
                Certificado com ≥ {data.notas?.nota_minima ?? 70}%.
              </p>
              <p>Tentativas restantes: {prova.tentativas_restantes}</p>
              {tempoRestante !== null && (
                <div className={`player-timer${tempoRestante < 60 ? " player-timer--urgente" : ""}`}>
                  Tempo restante: {formatTimer(tempoRestante)}
                </div>
              )}
              {prova.questoes.map((q) => (
                <div key={q.id} className="gestao-questao">
                  <p>{q.enunciado}</p>
                  {q.opcoes.map((op, i) => (
                    <label key={i} className="gestao-check">
                      <input
                        type="radio"
                        name={`pq-${q.id}`}
                        checked={respostas[q.id] === i}
                        onChange={() => setRespostas({ ...respostas, [q.id]: i })}
                      />
                      {op}
                    </label>
                  ))}
                </div>
              ))}
              <button type="button" className="btn btn-primary" onClick={enviarProva}>Enviar prova</button>
            </div>
          )}

          {resultado && (
            <div className="alert alert-success">
              {resultado.nota_final != null ? (
                <>
                  Nota da prova: {resultado.nota_prova ?? resultado.nota}% ·
                  Média atividades: {resultado.media_atividades}% ·
                  Nota final: {resultado.nota_final}% —
                  {resultado.certificado ? " Certificado liberado!" : " Abaixo de 70% — tente novamente se houver tentativas."}
                </>
              ) : (
                <>
                  Nota: {resultado.nota}% — {resultado.aprovado ? "Aprovado!" : "Não aprovado."}
                </>
              )}
            </div>
          )}

          {!temConteudo && (
            <p>Selecione a descrição, um material, uma videoaula, a atividade ou a prova final.</p>
          )}
        </main>
      </div>
    </div>
  );
}
