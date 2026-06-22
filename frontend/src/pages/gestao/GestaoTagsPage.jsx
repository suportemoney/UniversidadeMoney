import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

const FORM_VAZIO = { nome: "", slug: "", ativo: true };

export default function GestaoTagsPage() {
  const [itens, setItens] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");

  const carregar = () => gestaoApi.listarTags().then(setItens);

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({ nome: modal.item.nome, slug: modal.item.slug, ativo: modal.item.ativo });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro("");
  }, [modal]);

  const salvar = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      if (modal.item) {
        await gestaoApi.atualizarTag(modal.item.id, form);
      } else {
        await gestaoApi.criarTag(form);
      }
      setModal({ open: false, item: null });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const fecharModal = () => setModal({ open: false, item: null });

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Tags de curso</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, item: null })}>
          Nova tag
        </button>
      </div>
      <p className="gestao-muted">
        Tags categorizam cursos e definem quais conteúdos cada plano pode exibir ao aluno.
      </p>

      <table className="gestao-table">
        <thead>
          <tr><th>Nome</th><th>Slug</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {itens.map((t) => (
            <tr key={t.id}>
              <td>{t.nome}</td>
              <td><code>{t.slug}</code></td>
              <td>{t.ativo ? "Ativa" : "Inativa"}</td>
              <td>
                <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: t })}>
                  Editar
                </button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(t)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={modal.open}
        onClose={fecharModal}
        title={modal.item ? "Editar tag" : "Nova tag"}
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>Cancelar</button>
            <button type="submit" form="form-tag" className="btn btn-primary btn-sm">Salvar</button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-tag" className="gestao-form gestao-form--modal" onSubmit={salvar}>
          <label className="gestao-field">
            Nome
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
              placeholder="Ex.: Vendas"
            />
          </label>
          <label className="gestao-field">
            Slug
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              placeholder="vendas"
            />
          </label>
          <label className="gestao-checkbox">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            Tag ativa
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => { await gestaoApi.excluirTag(excluir.id); carregar(); }}
        title="Excluir tag"
        message={`Excluir a tag "${excluir?.nome}"? Planos e cursos vinculados perderão essa associação.`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
