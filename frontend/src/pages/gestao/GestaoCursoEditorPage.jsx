import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QuestaoEditor from "../../components/gestao/QuestaoEditor";
import VideoUploadField from "../../components/gestao/VideoUploadField";
import { gestaoApi } from "../../services/gestaoApi";

const ABAS = [
  { id: "info", label: "Informações" },
  { id: "modulos", label: "Módulos e aulas" },
  { id: "atividades", label: "Atividades" },
  { id: "prova", label: "Prova final" },
  { id: "publicar", label: "Publicar" },
];

export default function GestaoCursoEditorPage() {
  const { id } = useParams();
  const [aba, setAba] = useState("info");
  const [curso, setCurso] = useState(null);
  const [setores, setSetores] = useState([]);
  const [prova, setProva] = useState(null);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  const carregar = useCallback(() => {
    gestaoApi.obterCurso(id).then(setCurso);
    gestaoApi.obterProva(id).then(setProva).catch(() => setProva(null));
  }, [id]);

  useEffect(() => {
    carregar();
    gestaoApi.setores().then(setSetores);
  }, [carregar]);

  const salvarInfo = async (e) => {
    e.preventDefault();
    try {
      await gestaoApi.atualizarCurso(id, {
        titulo: curso.titulo,
        descricao: curso.descricao,
        setor: curso.setor,
        is_novo: curso.is_novo,
      });
      setMsg("Informações salvas.");
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const addModulo = async () => {
    const titulo = prompt("Título do módulo:");
    if (!titulo) return;
    await gestaoApi.criarModulo(id, { titulo });
    carregar();
  };

  const addAula = async (moduloId) => {
    const titulo = prompt("Título da aula:");
    if (!titulo) return;
    await gestaoApi.criarAula(moduloId, { titulo });
    carregar();
  };

  const addAtividade = async (moduloId) => {
    const titulo = prompt("Título da atividade:");
    if (!titulo) return;
    await gestaoApi.criarAtividade(moduloId, { titulo, tipo: "quiz" });
    carregar();
  };

  const publicar = async () => {
    try {
      await gestaoApi.publicarCurso(id);
      setMsg("Curso publicado!");
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const arquivar = async () => {
    await gestaoApi.arquivarCurso(id);
    carregar();
  };

  if (!curso) return <p>Carregando curso...</p>;

  return (
    <div>
      <div className="gestao-page-header">
        <h1>{curso.titulo}</h1>
        <Link to="/gestao/cursos" className="btn btn-outline btn-sm">← Voltar</Link>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="gestao-tabs">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`gestao-tab${aba === a.id ? " active" : ""}`}
            onClick={() => { setAba(a.id); setErro(""); setMsg(""); }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "info" && (
        <form className="gestao-form" onSubmit={salvarInfo}>
          <label>
            Título
            <input
              value={curso.titulo}
              onChange={(e) => setCurso({ ...curso, titulo: e.target.value })}
              required
            />
          </label>
          <label>
            Descrição
            <textarea
              value={curso.descricao}
              onChange={(e) => setCurso({ ...curso, descricao: e.target.value })}
              rows={5}
            />
          </label>
          <label>
            Setor
            <select
              value={curso.setor || ""}
              onChange={(e) => setCurso({ ...curso, setor: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Selecione...</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </label>
          <label className="gestao-check">
            <input
              type="checkbox"
              checked={curso.is_novo}
              onChange={(e) => setCurso({ ...curso, is_novo: e.target.checked })}
            />
            Marcar como novo
          </label>
          <button type="submit" className="btn btn-primary">Salvar</button>
        </form>
      )}

      {aba === "modulos" && (
        <div>
          <button type="button" className="btn btn-primary btn-sm" onClick={addModulo}>+ Módulo</button>
          {curso.modulos?.map((mod) => (
            <div key={mod.id} className="gestao-modulo">
              <h3>{mod.titulo}</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => addAula(mod.id)}>+ Aula</button>
              {mod.aulas?.map((aula) => (
                <div key={aula.id} className="gestao-aula">
                  <strong>{aula.titulo}</strong>
                  <VideoUploadField
                    aula={aula}
                    onUploaded={() => carregar()}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {aba === "atividades" && (
        <div>
          {curso.modulos?.map((mod) => (
            <div key={mod.id} className="gestao-modulo">
              <h3>{mod.titulo}</h3>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => addAtividade(mod.id)}>
                + Atividade
              </button>
              {mod.atividades?.map((ativ) => (
                <div key={ativ.id} className="gestao-atividade">
                  <h4>{ativ.titulo}</h4>
                  {ativ.questoes?.map((q) => (
                    <div key={q.id} className="gestao-questao-resumo">
                      <p>{q.enunciado}</p>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => gestaoApi.excluirQuestao(q.id).then(carregar)}
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                  <QuestaoEditor
                    onSave={async (data) => {
                      await gestaoApi.criarQuestaoAtividade(ativ.id, data);
                      carregar();
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {aba === "prova" && (
        <div className="gestao-form">
          <label>
            Título da prova
            <input
              value={prova?.titulo || "Prova final"}
              onChange={(e) => setProva({ ...prova, titulo: e.target.value })}
            />
          </label>
          <label>
            Nota mínima (%)
            <input
              type="number"
              min={0}
              max={100}
              value={prova?.nota_minima ?? 70}
              onChange={(e) => setProva({ ...prova, nota_minima: Number(e.target.value) })}
            />
          </label>
          <label>
            Tentativas máximas
            <input
              type="number"
              min={1}
              value={prova?.tentativas_max ?? 3}
              onChange={(e) => setProva({ ...prova, tentativas_max: Number(e.target.value) })}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              const p = await gestaoApi.salvarProva(id, {
                titulo: prova?.titulo || "Prova final",
                nota_minima: prova?.nota_minima ?? 70,
                tentativas_max: prova?.tentativas_max ?? 3,
              });
              setProva(p);
              setMsg("Prova salva.");
            }}
          >
            Salvar configuração
          </button>

          {prova?.questoes?.map((q) => (
            <div key={q.id} className="gestao-questao-resumo">
              <p>{q.enunciado}</p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => gestaoApi.excluirQuestao(q.id).then(carregar)}
              >
                Excluir
              </button>
            </div>
          ))}

          {prova?.id && (
            <QuestaoEditor
              onSave={async (data) => {
                await gestaoApi.criarQuestaoProva(prova.id, data);
                carregar();
              }}
            />
          )}
        </div>
      )}

      {aba === "publicar" && (
        <div className="gestao-publicar">
          <p>Status atual: <strong>{curso.status}</strong></p>
          <ul className="gestao-checklist">
            <li>{curso.modulos?.length || 0} módulo(s)</li>
            <li>
              {curso.modulos?.reduce((acc, m) => acc + (m.aulas?.length || 0), 0) || 0} aula(s) em vídeo
            </li>
          </ul>
          {curso.status !== "publicado" && (
            <button type="button" className="btn btn-success" onClick={publicar}>Publicar curso</button>
          )}
          {curso.status === "publicado" && (
            <button type="button" className="btn btn-outline" onClick={arquivar}>Arquivar curso</button>
          )}
        </div>
      )}
    </div>
  );
}
