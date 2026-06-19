import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoBibliotecaPage() {
  const [itens, setItens] = useState([]);
  const [setores, setSetores] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", setor: "", publicado: true });
  const [pdfId, setPdfId] = useState(null);

  const carregar = () => gestaoApi.listarBiblioteca().then(setItens);

  useEffect(() => {
    carregar();
    gestaoApi.setores().then(setSetores);
  }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({
        titulo: modal.item.titulo,
        descricao: modal.item.descricao || "",
        setor: modal.item.setor || "",
        publicado: modal.item.publicado,
      });
    } else {
      setForm({ titulo: "", descricao: "", setor: "", publicado: true });
    }
  }, [modal]);

  const salvar = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      setor: form.setor ? Number(form.setor) : null,
    };
    let criado;
    if (modal.item) {
      criado = await gestaoApi.atualizarBiblioteca(modal.item.id, payload);
    } else {
      criado = await gestaoApi.criarBiblioteca(payload);
    }
    setModal({ open: false, item: null });
    carregar();
    return criado;
  };

  const uploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pdfId) return;
    await gestaoApi.uploadPdfBiblioteca(pdfId, file);
    carregar();
  };

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Biblioteca (PDF)</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, item: null })}>
          Novo material
        </button>
      </div>
      <table className="gestao-table">
        <thead>
          <tr><th>Título</th><th>Setor</th><th>PDF</th><th>Publicado</th><th></th></tr>
        </thead>
        <tbody>
          {itens.map((m) => (
            <tr key={m.id}>
              <td>{m.titulo}</td>
              <td>{m.setor_nome || "—"}</td>
              <td>
                {m.arquivo_url ? (
                  <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer">Ver PDF</a>
                ) : (
                  <button type="button" className="btn-link" onClick={() => setPdfId(m.id)}>Enviar PDF</button>
                )}
              </td>
              <td>{m.publicado ? "Sim" : "Não"}</td>
              <td>
                <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: m })}>Editar</button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(m)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pdfId && (
        <label className="btn btn-outline btn-sm" style={{ marginTop: "1rem" }}>
          Selecionar PDF
          <input type="file" accept="application/pdf" hidden onChange={uploadPdf} />
        </label>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? "Editar material" : "Novo material"}>
        <form className="gestao-form" onSubmit={async (e) => { e.preventDefault(); await salvar(e); }}>
          <label>Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <label>Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></label>
          <label>Setor
            <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
              <option value="">Geral</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </label>
          <label className="gestao-check">
            <input type="checkbox" checked={form.publicado} onChange={(e) => setForm({ ...form, publicado: e.target.checked })} />
            Publicado
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
        onConfirm={async () => { await gestaoApi.excluirBiblioteca(excluir.id); carregar(); }}
        title="Excluir material"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
