import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AtividadeModal from "../../components/gestao/AtividadeModal";
import AulaModal from "../../components/gestao/AulaModal";
import ModuloModal from "../../components/gestao/ModuloModal";
import QuestaoEditor from "../../components/gestao/QuestaoEditor";
import ThumbnailUploadField from "../../components/gestao/ThumbnailUploadField";
import VideoUploadField from "../../components/gestao/VideoUploadField";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
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
  const [tags, setTags] = useState([]);
  const [prova, setProva] = useState(null);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [errosPublicar, setErrosPublicar] = useState([]);

  const [moduloModal, setModuloModal] = useState({ open: false, modulo: null });
  const [aulaModal, setAulaModal] = useState({ open: false, aula: null, moduloId: null });
  const [ativModal, setAtivModal] = useState({ open: false, moduloId: null });
  const [confirm, setConfirm] = useState({ open: false, tipo: "", alvo: null });
  const [questaoEdit, setQuestaoEdit] = useState(null);

  const carregar = useCallback(() => {
    gestaoApi.obterCurso(id).then(setCurso);
    gestaoApi.obterProva(id).then(setProva).catch(() => setProva(null));
  }, [id]);

  useEffect(() => {
    carregar();
    gestaoApi.setores().then(setSetores);
    gestaoApi.listarTags().then(setTags);
  }, [carregar]);

  const salvarInfo = async (e) => {
    e.preventDefault();
    try {
      await gestaoApi.atualizarCurso(id, {
        titulo: curso.titulo,
        descricao: curso.descricao,
        setor: curso.setor,
        is_novo: curso.is_novo,
        tags: (curso.tags || []).map((t) => (typeof t === "object" ? t.id : t)),
      });
      setMsg("Informações salvas.");
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const salvarModulo = async (data) => {
    if (moduloModal.modulo) {
      await gestaoApi.atualizarModulo(moduloModal.modulo.id, data);
    } else {
      await gestaoApi.criarModulo(id, data);
    }
    carregar();
  };

  const salvarAula = async (data) => {
    if (aulaModal.aula) {
      await gestaoApi.atualizarAula(aulaModal.aula.id, data);
    } else {
      await gestaoApi.criarAula(aulaModal.moduloId, data);
    }
    carregar();
  };

  const salvarAtividade = async (data) => {
    await gestaoApi.criarAtividade(ativModal.moduloId, data);
    carregar();
  };

  const reordenarModulo = async (idx, dir) => {
    const ids = curso.modulos.map((m) => m.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await gestaoApi.reordenarModulos(id, ids);
    carregar();
  };

  const executarExclusao = async () => {
    const { tipo, alvo } = confirm;
    if (tipo === "modulo") await gestaoApi.excluirModulo(alvo.id);
    if (tipo === "aula") await gestaoApi.excluirAula(alvo.id);
    if (tipo === "questao") await gestaoApi.excluirQuestao(alvo.id);
    carregar();
  };

  const publicar = async () => {
    setErrosPublicar([]);
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
      <GestaoPageHeader
        icon="cursos"
        title={curso.titulo}
        subtitle="Editor de curso — módulos, aulas e publicação"
      >
        <Link to="/gestao/cursos" className="btn btn-outline btn-sm">← Voltar</Link>
      </GestaoPageHeader>

      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      {msg && <div className="modal-alert modal-alert--success">{msg}</div>}

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
          <ThumbnailUploadField
            cursoId={id}
            thumbnailUrl={curso.thumbnail_url}
            onUploaded={(data) => setCurso(data)}
          />
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
          <div className="gestao-form-section">
            <h3 className="gestao-form-section-title">Tags do curso</h3>
            {tags.length === 0 ? (
              <p className="gestao-muted">Nenhuma tag cadastrada. Crie em Gestão → Tags.</p>
            ) : (
              <div className="gestao-features-grid">
                {tags.filter((t) => t.ativo).map((t) => {
                  const selecionadas = (curso.tags || []).map((x) => (typeof x === "object" ? x.id : x));
                  return (
                    <label key={t.id} className="gestao-feature-card">
                      <input
                        type="checkbox"
                        checked={selecionadas.includes(t.id)}
                        onChange={() => {
                          const ids = selecionadas.includes(t.id)
                            ? selecionadas.filter((id) => id !== t.id)
                            : [...selecionadas, t.id];
                          setCurso({
                            ...curso,
                            tags: tags.filter((tag) => ids.includes(tag.id)),
                          });
                        }}
                      />
                      <span>{t.nome}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
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
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setModuloModal({ open: true, modulo: null })}
          >
            + Módulo
          </button>
          {curso.modulos?.map((mod, idx) => (
            <div key={mod.id} className="gestao-modulo">
              <div className="gestao-modulo-actions">
                <h3>{mod.titulo}</h3>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => reordenarModulo(idx, -1)}>↑</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => reordenarModulo(idx, 1)}>↓</button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setModuloModal({ open: true, modulo: mod })}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setConfirm({ open: true, tipo: "modulo", alvo: mod })}
                >
                  Excluir
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setAulaModal({ open: true, aula: null, moduloId: mod.id })}
                >
                  + Aula
                </button>
              </div>
              {mod.aulas?.map((aula) => (
                <div key={aula.id} className="gestao-aula">
                  <div className="gestao-modulo-actions">
                    <strong>{aula.titulo}</strong>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setAulaModal({ open: true, aula, moduloId: mod.id })}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setConfirm({ open: true, tipo: "aula", alvo: aula })}
                    >
                      Excluir
                    </button>
                    {aula.video_url && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => gestaoApi.removerVideo(aula.id).then(carregar)}
                      >
                        Remover vídeo
                      </button>
                    )}
                  </div>
                  <VideoUploadField aula={aula} onUploaded={() => carregar()} />
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
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setAtivModal({ open: true, moduloId: mod.id })}
              >
                + Atividade
              </button>
              {mod.atividades?.map((ativ) => (
                <div key={ativ.id} className="gestao-atividade">
                  <h4>{ativ.titulo} ({ativ.tipo})</h4>
                  {ativ.questoes?.map((q) => (
                    <div key={q.id} className="gestao-questao-resumo">
                      <p>{q.enunciado}</p>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setQuestaoEdit(q)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setConfirm({ open: true, tipo: "questao", alvo: q })}
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                  {!questaoEdit && (
                    <QuestaoEditor
                      onSave={async (data) => {
                        await gestaoApi.criarQuestaoAtividade(ativ.id, data);
                        carregar();
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          {questaoEdit && (
            <div className="gestao-modulo">
              <h3>Editar questão</h3>
              <QuestaoEditor
                questao={questaoEdit}
                onSave={async (data) => {
                  await gestaoApi.atualizarQuestao(questaoEdit.id, data);
                  setQuestaoEdit(null);
                  carregar();
                }}
                onDelete={() => {
                  setConfirm({ open: true, tipo: "questao", alvo: questaoEdit });
                  setQuestaoEdit(null);
                }}
              />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setQuestaoEdit(null)}>
                Cancelar edição
              </button>
            </div>
          )}
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
          <label>
            Tempo limite (minutos, opcional)
            <input
              type="number"
              min={1}
              value={prova?.tempo_limite_min ?? ""}
              onChange={(e) => setProva({
                ...prova,
                tempo_limite_min: e.target.value ? Number(e.target.value) : null,
              })}
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
                tempo_limite_min: prova?.tempo_limite_min || null,
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
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setQuestaoEdit(q)}>
                Editar
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setConfirm({ open: true, tipo: "questao", alvo: q })}
              >
                Excluir
              </button>
            </div>
          ))}

          {prova?.id && !questaoEdit && (
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
          {errosPublicar.length > 0 && (
            <ul className="alert alert-error">
              {errosPublicar.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
          {curso.status !== "publicado" && (
            <button type="button" className="btn btn-success" onClick={publicar}>Publicar curso</button>
          )}
          {curso.status === "publicado" && (
            <button type="button" className="btn btn-outline" onClick={arquivar}>Arquivar curso</button>
          )}
        </div>
      )}

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
      <AtividadeModal
        open={ativModal.open}
        onClose={() => setAtivModal({ open: false, moduloId: null })}
        onSave={salvarAtividade}
      />
      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, tipo: "", alvo: null })}
        onConfirm={executarExclusao}
        title="Confirmar exclusão"
        message="Esta ação não pode ser desfeita. Deseja continuar?"
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
