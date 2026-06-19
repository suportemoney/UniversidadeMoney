import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../services/api";
import "../styles/gestao.css";

export default function CursoPlayerPage() {
  const { cursoId } = useParams();
  const [data, setData] = useState(null);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [prova, setProva] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");

  const carregar = () => {
    apiFetch(`/cursos/${cursoId}/conteudo/`).then(setData);
  };

  useEffect(() => {
    carregar();
  }, [cursoId]);

  const concluirAula = async (aulaId) => {
    await apiFetch(`/aulas/${aulaId}/concluir/`, { method: "POST" });
    carregar();
  };

  const abrirAtividade = async (id) => {
    setResultado(null);
    setRespostas({});
    const d = await apiFetch(`/atividades/${id}/`);
    setAtividade(d);
    setAulaAtual(null);
    setProva(null);
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
    setResultado(null);
    setRespostas({});
    try {
      const p = await apiFetch(`/provas/${data.prova_final.id}/`);
      setProva(p);
      setAtividade(null);
      setAulaAtual(null);
    } catch (e) {
      setErro(e.message);
    }
  };

  const enviarProva = async () => {
    const r = await apiFetch(`/provas/${prova.id}/`, {
      method: "POST",
      body: JSON.stringify({ respostas }),
    });
    setResultado(r);
    carregar();
  };

  if (!data) return <p>Carregando curso...</p>;

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
              {mod.aulas.map((aula) => (
                <button
                  key={aula.id}
                  type="button"
                  className={`player-item${aula.concluida ? " done" : ""}`}
                  onClick={() => { setAulaAtual(aula); setAtividade(null); setProva(null); setResultado(null); }}
                >
                  {aula.concluida ? "✓" : "▶"} {aula.titulo}
                </button>
              ))}
              {mod.atividades.map((a) => (
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

          {!aulaAtual && !atividade && !prova && (
            <p>Selecione uma aula, atividade ou a prova final.</p>
          )}
        </main>
      </div>
    </div>
  );
}
