import { useEffect, useState } from "react";
import QuestaoEditor from "../QuestaoEditor";
import VideoUploadField from "../VideoUploadField";
import GestaoIcon from "../GestaoIcons";
import CursoMateriaisModal from "./CursoMateriaisModal";
import CursoProvaModal from "./CursoProvaModal";
import { gestaoApi } from "../../../services/gestaoApi";

/**
 * Painel expandido do curso: descrição + resumos; material e prova em modais.
 */
export default function CursoExpandPanel({ cursoId, onChanged }) {
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvandoDesc, setSalvandoDesc] = useState(false);
  const [moduloAberto, setModuloAberto] = useState(null);
  const [novoModulo, setNovoModulo] = useState("");
  const [prova, setProva] = useState(null);
  const [novaAula, setNovaAula] = useState({});
  const [modalMateriais, setModalMateriais] = useState(false);
  const [modalProva, setModalProva] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setErro("");
    try {
      const [c, p] = await Promise.all([
        gestaoApi.obterCurso(cursoId),
        gestaoApi.obterProva(cursoId),
      ]);
      setCurso(c);
      setDescricao(c.descricao || "");
      setProva(p);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [cursoId]);

  const avisar = () => onChanged?.();

  const salvarDescricao = async () => {
    setSalvandoDesc(true);
    try {
      const c = await gestaoApi.atualizarCurso(cursoId, { descricao });
      setCurso((prev) => ({ ...prev, ...c }));
      avisar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvandoDesc(false);
    }
  };

  const criarModulo = async (e) => {
    e.preventDefault();
    if (!novoModulo.trim()) return;
    try {
      await gestaoApi.criarModulo(cursoId, { titulo: novoModulo.trim() });
      setNovoModulo("");
      await carregar();
      avisar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const excluirModulo = async (id) => {
    if (!window.confirm("Excluir este módulo?")) return;
    await gestaoApi.excluirModulo(id);
    if (moduloAberto === id) setModuloAberto(null);
    await carregar();
    avisar();
  };

  const criarAula = async (moduloId) => {
    const titulo = (novaAula[moduloId] || "").trim();
    if (!titulo) return;
    try {
      await gestaoApi.criarAula(moduloId, { titulo });
      setNovaAula((prev) => ({ ...prev, [moduloId]: "" }));
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const excluirAula = async (id) => {
    await gestaoApi.excluirAula(id);
    await carregar();
  };

  const garantirAtividade = async (modulo) => {
    if (modulo.atividades?.length) return modulo.atividades[0];
    const ativ = await gestaoApi.criarAtividade(modulo.id, {
      titulo: "Atividade avaliativa",
      tipo: "quiz",
    });
    await carregar();
    return ativ;
  };

  const publicar = async () => {
    try {
      await gestaoApi.publicarCurso(cursoId);
      await carregar();
      avisar();
    } catch (err) {
      setErro(err.message);
    }
  };

  if (loading) {
    return <div className="curso-expand"><p className="gestao-muted">Carregando conteúdo...</p></div>;
  }

  if (!curso) {
    return <div className="curso-expand"><p className="gestao-erro">{erro || "Curso não encontrado."}</p></div>;
  }

  const materiais = curso.materiais || [];
  const qtdMateriais = materiais.length;
  const qtdQuestoes = prova?.questoes?.length || 0;
  const provaConfigurada = Boolean(prova?.id || qtdQuestoes);

  return (
    <div className="curso-expand" onClick={(e) => e.stopPropagation()}>
      {erro && <div className="modal-alert modal-alert--error" style={{ whiteSpace: "pre-wrap" }}>{erro}</div>}

      <section className="curso-expand-section">
        <h4>1. Descrição</h4>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          placeholder="Descreva o curso..."
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={salvarDescricao} disabled={salvandoDesc}>
          {salvandoDesc ? "Salvando..." : "Salvar descrição"}
        </button>
      </section>

      <section className="curso-expand-section curso-expand-resumo">
        <div className="curso-expand-resumo-head">
          <div>
            <h4>2. Material de apoio</h4>
            <p className="curso-expand-resumo-meta">
              {qtdMateriais === 0
                ? "Nenhum PDF cadastrado (opcional)"
                : `${qtdMateriais} PDF(s): ${materiais.map((m) => m.titulo).slice(0, 3).join(", ")}${qtdMateriais > 3 ? "…" : ""}`}
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalMateriais(true)}>
            Gerenciar materiais
          </button>
        </div>
      </section>

      <section className="curso-expand-section">
        <h4>3. Módulos</h4>
        <form className="curso-expand-inline-form" onSubmit={criarModulo}>
          <input
            placeholder="Título do módulo"
            value={novoModulo}
            onChange={(e) => setNovoModulo(e.target.value)}
          />
          <button type="submit" className="btn btn-outline btn-sm">
            <GestaoIcon name="mais" /> Módulo
          </button>
        </form>

        <div className="curso-expand-modulos">
          {(curso.modulos || []).map((mod) => {
            const aberto = moduloAberto === mod.id;
            const ativ = mod.atividades?.[0];
            return (
              <div key={mod.id} className={`curso-expand-modulo${aberto ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="curso-expand-modulo-head"
                  onClick={() => setModuloAberto(aberto ? null : mod.id)}
                >
                  <span>{mod.titulo}</span>
                  <span className="gestao-muted">
                    {mod.aulas?.length || 0} vídeo(s)
                    {ativ ? " · atividade" : ""}
                  </span>
                </button>
                <div className="curso-expand-modulo-actions">
                  <button type="button" className="gestao-icon-btn gestao-icon-btn--danger" title="Excluir módulo" onClick={() => excluirModulo(mod.id)}>
                    <GestaoIcon name="excluir" />
                  </button>
                </div>

                {aberto && (
                  <div className="curso-expand-modulo-body">
                    <h5>Videoaulas</h5>
                    <ul className="curso-expand-list">
                      {(mod.aulas || []).map((aula) => (
                        <li key={aula.id} className="curso-expand-aula">
                          <strong>{aula.titulo}</strong>
                          <VideoUploadField
                            aula={aula}
                            onUploaded={async () => {
                              await carregar();
                              avisar();
                            }}
                          />
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => excluirAula(aula.id)}>
                            Excluir aula
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="curso-expand-inline-form">
                      <input
                        placeholder="Título da videoaula"
                        value={novaAula[mod.id] || ""}
                        onChange={(e) => setNovaAula((prev) => ({ ...prev, [mod.id]: e.target.value }))}
                      />
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => criarAula(mod.id)}>
                        Adicionar vídeo
                      </button>
                    </div>

                    <h5>Atividade avaliativa (final do módulo)</h5>
                    {!ativ ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => garantirAtividade(mod).catch((err) => setErro(err.message))}
                      >
                        Criar atividade final
                      </button>
                    ) : (
                      <div className="curso-expand-atividade">
                        <p><strong>{ativ.titulo}</strong></p>
                        {(ativ.questoes || []).map((q) => (
                          <QuestaoEditor
                            key={q.id}
                            questao={q}
                            onSave={async (payload) => {
                              await gestaoApi.atualizarQuestao(q.id, payload);
                              await carregar();
                            }}
                            onDelete={async (id) => {
                              await gestaoApi.excluirQuestao(id);
                              await carregar();
                            }}
                          />
                        ))}
                        <QuestaoEditor
                          onSave={async (payload) => {
                            await gestaoApi.criarQuestaoAtividade(ativ.id, payload);
                            await carregar();
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="curso-expand-section curso-expand-resumo">
        <div className="curso-expand-resumo-head">
          <div>
            <h4>4. Prova final</h4>
            <p className="curso-expand-resumo-meta">
              {provaConfigurada
                ? `${prova?.titulo || "Prova final"} · ${qtdQuestoes} questão(ões) · ${prova?.tentativas_max ?? 3} tentativa(s) · nota mín. ${prova?.nota_minima ?? 70}%`
                : "Ainda não configurada"}
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalProva(true)}>
            {provaConfigurada ? "Editar prova" : "Configurar prova"}
          </button>
        </div>
      </section>

      <div className="curso-expand-footer">
        <button type="button" className="btn btn-primary btn-sm" onClick={publicar}>
          Publicar curso
        </button>
      </div>

      <CursoMateriaisModal
        open={modalMateriais}
        onClose={() => setModalMateriais(false)}
        cursoId={cursoId}
        materiais={materiais}
        onChanged={async () => {
          await carregar();
          avisar();
        }}
      />

      <CursoProvaModal
        open={modalProva}
        onClose={() => setModalProva(false)}
        cursoId={cursoId}
        onChanged={async () => {
          await carregar();
          avisar();
        }}
      />
    </div>
  );
}
