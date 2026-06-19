import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

const TIPOS = [
  { value: "info", label: "Informação" },
  { value: "trofeu", label: "Conquista" },
  { value: "megafone", label: "Aviso" },
];

export default function GestaoComunicadosPage() {
  const [itens, setItens] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", tipo: "info" });

  const carregar = () => gestaoApi.listarComunicados().then(setItens);

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({ titulo: modal.item.titulo, conteudo: modal.item.conteudo, tipo: modal.item.tipo });
    } else {
      setForm({ titulo: "", conteudo: "", tipo: "info" });
    }
  }, [modal]);

  const salvar = async (e) => {
    e.preventDefault();
    if (modal.item) {
      await gestaoApi.atualizarComunicado(modal.item.id, form);
    } else {
      await gestaoApi.criarComunicado(form);
    }
    setModal({ open: false, item: null });
    carregar();
  };

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Comunicados</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, item: null })}>
          Novo comunicado
        </button>
      </div>
      <table className="gestao-table">
        <thead>
          <tr><th>Título</th><th>Tipo</th><th>Data</th><th></th></tr>
        </thead>
        <tbody>
          {itens.map((c) => (
            <tr key={c.id}>
              <td>{c.titulo}</td>
              <td>{c.tipo}</td>
              <td>{new Date(c.criado_em).toLocaleDateString("pt-BR")}</td>
              <td>
                <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: c })}>Editar</button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(c)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? "Editar" : "Novo comunicado"}>
        <form className="gestao-form" onSubmit={salvar}>
          <label>Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <label>Conteúdo<textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={4} required /></label>
          <label>Tipo
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal({ open: false, item: null })}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => { await gestaoApi.excluirComunicado(excluir.id); carregar(); }}
        title="Excluir comunicado"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
