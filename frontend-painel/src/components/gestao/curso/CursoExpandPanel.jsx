import { useEffect, useState } from "react";
import QuestaoEditor from "../QuestaoEditor";
import VideoUploadField from "../VideoUploadField";
import GestaoIcon from "../GestaoIcons";
import ModuloModal from "../ModuloModal";
import AulaModal from "../AulaModal";
import ConfirmDialog from "../../ui/ConfirmDialog";
import CursoMateriaisModal from "./CursoMateriaisModal";
import CursoProvaModal from "./CursoProvaModal";
import { gestaoApi } from "../../../services/gestaoApi";

/**
 * Painel expandido do curso: CRUD de módulos/aulas em modal; material e prova em modais.
 */
export default function CursoExpandPanel({ cursoId, onChanged }) {
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvandoDesc, setSalvandoDesc] = useState(false);
  const [moduloAberto, setModuloAberto] = useState(null);
  const [prova, setProva] = useState(null);
  const [modalMateriais, setModalMateriais] = useState(false);
  const [modalProva, setModalProva] = useState(false);
  const [moduloModal, setModuloModal] = useState({ open: false, modulo: null });
  const [aulaModal, setAulaModal] = useState({ open: false, aula: null, moduloId: null });
  const [confirmar, setConfirmar] = useState(null);

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

  const salvarModulo = async (payload) => {
    if (moduloModal.modulo) {
      await gestaoApi.atualizarModulo(moduloModal.modulo.id, { titulo: payload.titulo });
    } else {
      await gestaoApi.criarModulo(cursoId, { titulo: payload.titulo });
    }
    await carregar();
    avisar();
  };

  const salvarAula = async (payload) => {
    if (aulaModal.aula) {
      await gestaoApi.atualizarAula(aulaModal.aula.id, payload);
    } else {
      await gestaoApi.criarAula(aulaModal.moduloId, payload);
    }
    await carregar();
    avisar();
  };

  const confirmarExclusao = async () => {
    if (!confirmar) return;
    try {
      if (confirmar.tipo === "modulo") {
        await gestaoApi.excluirModulo(confirmar.id);
        if (moduloAberto === confirmar.id) setModuloAberto(null);
      } else {
        await gestaoApi.excluirAula(confirmar.id);
      }
      await carregar();
      avisar();
    } catch (err) {
      setErro(err.message);
    }
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
        <div className="curso-expand-resumo-head">
          <h4>3. Módulos</h4>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setModuloModal({ open: true, modulo: null })}
          >
            <GestaoIcon name="mais" /> Novo módulo
          </button>
        </div>

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
                  <button
                    type="button"
                    className="gestao-icon-btn"
                    title="Editar módulo"
                    aria-label="Editar módulo"
                    onClick={() => setModuloModal({ open: true, modulo: mod })}
                  >
                    <GestaoIcon name="editar" />
                  </button>
                  <button
                    type="button"
                    className="gestao-icon-btn gestao-icon-btn--danger"
                    title="Excluir módulo"
                    aria-label="Excluir módulo"
                    onClick={() => setConfirmar({ tipo: "modulo", id: mod.id, titulo: mod.titulo })}
                  >
                    <GestaoIcon name="excluir" />
                  </button>
                </div>

                {aberto && (
                  <div className="curso-expand-modulo-body">
                    <div className="curso-expand-resumo-head">
                      <h5>Videoaulas</h5>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setAulaModal({ open: true, aula: null, moduloId: mod.id })}
                      >
                        <GestaoIcon name="mais" /> Nova aula
                      </button>
                    </div>
                    <ul className="curso-expand-list">
                      {(mod.aulas || []).map((aula) => (
                        <li key={aula.id} className="curso-expand-aula">
                          <div className="curso-expand-aula-head">
                            <div>
                              <strong>{aula.titulo}</strong>
                              {aula.descricao ? (
                                <p className="curso-expand-aula-desc">{aula.descricao}</p>
                              ) : null}
                            </div>
                            <div className="curso-expand-aula-actions">
                              <button
                                type="button"
                                className="gestao-icon-btn"
                                title="Editar aula"
                                aria-label="Editar aula"
                                onClick={() => setAulaModal({ open: true, aula, moduloId: mod.id })}
                              >
                                <GestaoIcon name="editar" />
                              </button>
                              <button
                                type="button"
                                className="gestao-icon-btn gestao-icon-btn--danger"
                                title="Excluir aula"
                                aria-label="Excluir aula"
                                onClick={() => setConfirmar({ tipo: "aula", id: aula.id, titulo: aula.titulo })}
                              >
                                <GestaoIcon name="excluir" />
                              </button>
                            </div>
                          </div>
                          <VideoUploadField
                            aula={aula}
                            onUploaded={async () => {
                              await carregar();
                              avisar();
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                    {!(mod.aulas || []).length && (
                      <p className="gestao-muted">Nenhuma aula neste módulo.</p>
                    )}

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
                      <div className="curso-expand-atividade gestao-atividade">
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

      <ModuloModal
        open={moduloModal.open}
        modulo={moduloModal.modulo}
        onClose={() => setModuloModal({ open: false, modulo: null })}
        onSave={salvarModulo}
      />

      <AulaModal
        open={aulaModal.open}
        aula={aulaModal.aula}
        onClose={() => setAulaModal({ open: false, aula: null, moduloId: null })}
        onSave={salvarAula}
      />

      <ConfirmDialog
        open={Boolean(confirmar)}
        onClose={() => setConfirmar(null)}
        onConfirm={confirmarExclusao}
        danger
        title={confirmar?.tipo === "modulo" ? "Excluir módulo" : "Excluir aula"}
        message={
          confirmar?.tipo === "modulo"
            ? `Excluir o módulo "${confirmar?.titulo}" e todas as aulas dele?`
            : `Excluir a aula "${confirmar?.titulo}"?`
        }
        confirmLabel="Excluir"
      />
    </div>
  );
}
