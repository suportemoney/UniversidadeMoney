import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import "../styles/gestao.css";

function formatTimer(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const TIPO_ICONE = {
  texto: "📖",
  apostila: "📎",
  video: "▶",
};

export default function CursoPlayerPage() {
  const { cursoId } = useParams();
  const [data, setData] = useState(null);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [textoModulo, setTextoModulo] = useState(null);
  const [arquivoAtual, setArquivoAtual] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [prova, setProva] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [tempoRestante, setTempoRestante] = useState(null);

  const limparConteudo = () => {
    setAulaAtual(null);
    setTextoModulo(null);
    setArquivoAtual(null);
    setAtividade(null);
    setProva(null);
    setResultado(null);
    setTempoRestante(null);
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

  const concluirTexto = async (moduloId) => {
    await apiFetch(`/modulos-texto/${moduloId}/concluir/`, { method: "POST" });
    carregar();
  };

  const concluirArquivo = async (arquivoId) => {
    await apiFetch(`/modulos-arquivos/${arquivoId}/concluir/`, { method: "POST" });
    carregar();
  };

  const abrirAtividade = async (id) => {
    limparConteudo();
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

  const temConteudo = aulaAtual || textoModulo || arquivoAtual || atividade || prova;

  return (
    <div className="player">
      <div className="gestao-page-header">
        <h1>{data.curso.titulo}</h1>
        <Link to="/dashboard/meus-cursos" className="btn btn-outline btn-sm">← Meus cursos</Link>
      </div>
      <p>Progresso: {data.progresso}% {data.certificado && "— Certificado emitido!"}</p>
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="player-grid">
        <aside className="player-sidebar">
          {data.modulos.map((mod) => (
            <div key={mod.id} className="player-modulo">
              <h3>{mod.titulo}</h3>

              {mod.tipo === "texto" && (
                <button
                  type="button"
                  className={`player-item${mod.texto_concluido ? " done" : ""}`}
                  onClick={() => { limparConteudo(); setTextoModulo(mod); }}
                >
                  {mod.texto_concluido ? "✓" : TIPO_ICONE.texto} O que você vai aprender
                </button>
              )}

              {mod.tipo === "apostila" && mod.arquivos?.map((arq) => (
                <button
                  key={arq.id}
                  type="button"
                  className={`player-item${arq.concluida ? " done" : ""}`}
                  onClick={() => { limparConteudo(); setArquivoAtual({ ...arq, moduloId: mod.id }); }}
                >
                  {arq.concluida ? "✓" : TIPO_ICONE.apostila} {arq.titulo}
                </button>
              ))}

              {mod.tipo === "video" && mod.aulas?.map((aula) => (
                <button
                  key={aula.id}
                  type="button"
                  className={`player-item${aula.concluida ? " done" : ""}`}
                  onClick={() => { limparConteudo(); setAulaAtual(aula); }}
                >
                  {aula.concluida ? "✓" : TIPO_ICONE.video} {aula.titulo}
                </button>
              ))}

              {mod.atividades?.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="player-item player-item--ativ"
                  onClick={() => abrirAtividade(a.id)}
                >
                  📝 {a.titulo}
                </button>
              ))}
            </div>
          ))}
          {data.prova_final && (
            <button type="button" className="btn btn-primary btn-sm" onClick={abrirProva}>
              Prova final
            </button>
          )}
        </aside>

        <main className="player-main">
          {textoModulo && (
            <div>
              <h2>{textoModulo.titulo}</h2>
              <div className="player-texto-conteudo">
                {(textoModulo.conteudo_texto || "").split("\n").map((linha, i) => (
                  <p key={i}>{linha || "\u00A0"}</p>
                ))}
              </div>
              {!textoModulo.texto_concluido && (
                <button type="button" className="btn btn-success" onClick={() => concluirTexto(textoModulo.id)}>
                  Marcar como lido
                </button>
              )}
            </div>
          )}

          {arquivoAtual && (
            <div>
              <h2>{arquivoAtual.titulo}</h2>
              {arquivoAtual.tipo === "audio" && arquivoAtual.arquivo_url ? (
                <audio controls src={arquivoAtual.arquivo_url} className="player-audio" />
              ) : arquivoAtual.arquivo_url ? (
                <iframe title={arquivoAtual.titulo} src={arquivoAtual.arquivo_url} className="player-pdf" />
              ) : (
                <p>Arquivo indisponível.</p>
              )}
              {!arquivoAtual.concluida && (
                <button type="button" className="btn btn-success" onClick={() => concluirArquivo(arquivoAtual.id)}>
                  Marcar como concluído
                </button>
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
              <p>Nota mínima: {prova.nota_minima}% — Tentativas restantes: {prova.tentativas_restantes}</p>
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
              Nota: {resultado.nota}% — {resultado.aprovado ? "Aprovado!" : "Não aprovado."}
              {resultado.certificado && " Certificado emitido!"}
            </div>
          )}

          {!temConteudo && (
            <p>Selecione um módulo, atividade ou a prova final.</p>
          )}
        </main>
      </div>
    </div>
  );
}
