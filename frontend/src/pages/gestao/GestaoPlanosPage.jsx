import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

const FEATURES = [
  { key: "acesso_cursos", label: "Cursos" },
  { key: "acesso_trilhas", label: "Trilhas" },
  { key: "acesso_biblioteca", label: "Biblioteca" },
  { key: "acesso_ao_vivo", label: "Ao vivo" },
  { key: "acesso_certificados", label: "Certificados" },
  { key: "acesso_ranking", label: "Ranking" },
  { key: "acesso_comunicados", label: "Comunicados" },
  { key: "acesso_progresso", label: "Progresso" },
];

const FORM_VAZIO = {
  titulo: "",
  slug: "",
  descricao: "",
  ativo: true,
  acesso_cursos: true,
  acesso_trilhas: false,
  acesso_biblioteca: false,
  acesso_ao_vivo: false,
  acesso_certificados: false,
  acesso_ranking: false,
  acesso_comunicados: false,
  acesso_progresso: false,
};

export default function GestaoPlanosPage() {
  const [itens, setItens] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");

  const carregar = () => gestaoApi.listarPlanos().then(setItens);

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({ ...FORM_VAZIO, ...modal.item });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro("");
  }, [modal]);

  const toggleFeature = (key) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  const salvar = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      if (modal.item) {
        await gestaoApi.atualizarPlano(modal.item.id, form);
      } else {
        await gestaoApi.criarPlano(form);
      }
      setModal({ open: false, item: null });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Planos</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, item: null })}>
          Novo plano
        </button>
      </div>

      <table className="gestao-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Recursos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {itens.map((p) => (
            <tr key={p.id}>
              <td>{p.titulo}</td>
              <td><code>{p.slug}</code></td>
              <td>{p.ativo ? "Ativo" : "Inativo"}</td>
              <td>
                {FEATURES.filter((f) => p[f.key]).map((f) => f.label).join(", ") || "—"}
              </td>
              <td>
                <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: p })}>
                  Editar
                </button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(p)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, item: null })}
        title={modal.item ? "Editar plano" : "Novo plano"}
      >
        {erro && <div className="alert alert-error">{erro}</div>}
        <form className="gestao-form" onSubmit={salvar}>
          <label>
            Título
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              placeholder="basico"
            />
          </label>
          <label>
            Descrição
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={3}
            />
          </label>
          <label className="gestao-checkbox">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            Plano ativo
          </label>
          <fieldset className="gestao-fieldset">
            <legend>Recursos incluídos</legend>
            {FEATURES.map((f) => (
              <label key={f.key} className="gestao-checkbox">
                <input
                  type="checkbox"
                  checked={!!form[f.key]}
                  onChange={() => toggleFeature(f.key)}
                />
                {f.label}
              </label>
            ))}
          </fieldset>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal({ open: false, item: null })}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => {
          await gestaoApi.excluirPlano(excluir.id);
          carregar();
        }}
        title="Excluir plano"
        message={`Excluir o plano "${excluir?.titulo}"? Tokens vinculados podem deixar de funcionar.`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
