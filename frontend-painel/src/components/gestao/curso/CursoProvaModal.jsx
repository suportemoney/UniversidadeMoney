import { useEffect, useState } from "react";
import Modal from "../../ui/Modal";
import QuestaoEditor from "../QuestaoEditor";
import { gestaoApi } from "../../../services/gestaoApi";

/** Modal flutuante para configurar prova final e questões. */
export default function CursoProvaModal({ open, onClose, cursoId, onChanged }) {
  const [prova, setProva] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setErro("");
    try {
      const p = await gestaoApi.obterProva(cursoId);
      setProva(p);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) carregar();
  }, [open, cursoId]);

  const salvarCfg = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const p = await gestaoApi.salvarProva(cursoId, {
        titulo: prova?.titulo || "Prova final",
        nota_minima: Number(prova?.nota_minima) || 70,
        tentativas_max: Number(prova?.tentativas_max) || 3,
        tempo_limite_min: prova?.tempo_limite_min || null,
      });
      setProva(p);
      onChanged?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const garantirProva = async () => {
    if (prova?.id) return prova;
    const p = await gestaoApi.salvarProva(cursoId, {
      titulo: prova?.titulo || "Prova final",
      nota_minima: Number(prova?.nota_minima) || 70,
      tentativas_max: Number(prova?.tentativas_max) || 3,
    });
    setProva(p);
    return p;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Prova final"
      wide
      footer={(
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Fechar
        </button>
      )}
    >
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      {loading && <p className="gestao-muted">Carregando prova...</p>}

      {!loading && (
        <>
          <form className="curso-expand-prova-form" onSubmit={salvarCfg}>
            <label>
              Título
              <input
                value={prova?.titulo || "Prova final"}
                onChange={(e) => setProva({ ...prova, titulo: e.target.value })}
              />
            </label>
            <label>
              Tentativas máx.
              <input
                type="number"
                min={1}
                value={prova?.tentativas_max ?? 3}
                onChange={(e) => setProva({ ...prova, tentativas_max: e.target.value })}
              />
            </label>
            <label>
              Nota mínima (%)
              <input
                type="number"
                min={0}
                max={100}
                value={prova?.nota_minima ?? 70}
                onChange={(e) => setProva({ ...prova, nota_minima: e.target.value })}
              />
            </label>
            <button type="submit" className="btn btn-outline btn-sm" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar prova"}
            </button>
          </form>

          <h4 style={{ margin: "1rem 0 0.5rem", fontSize: "0.9rem" }}>
            Questões ({prova?.questoes?.length || 0})
          </h4>

          {(prova?.questoes || []).map((q) => (
            <QuestaoEditor
              key={q.id}
              questao={q}
              onSave={async (payload) => {
                await gestaoApi.atualizarQuestao(q.id, payload);
                await carregar();
                onChanged?.();
              }}
              onDelete={async (id) => {
                await gestaoApi.excluirQuestao(id);
                await carregar();
                onChanged?.();
              }}
            />
          ))}

          <QuestaoEditor
            onSave={async (payload) => {
              const p = await garantirProva();
              await gestaoApi.criarQuestaoProva(p.id, payload);
              await carregar();
              onChanged?.();
            }}
          />
        </>
      )}
    </Modal>
  );
}
