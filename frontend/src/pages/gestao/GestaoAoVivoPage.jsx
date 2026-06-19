import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoAoVivoPage() {
  const [itens, setItens] = useState([]);
  const [setores, setSetores] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState({ titulo: "", data: "", hora: "", setor: "", descricao: "" });

  const carregar = () => gestaoApi.listarAoVivo().then(setItens);

  useEffect(() => {
    carregar();
    gestaoApi.setores().then(setSetores);
  }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({
        titulo: modal.item.titulo,
        data: modal.item.data,
        hora: modal.item.hora?.slice(0, 5) || modal.item.hora,
        setor: modal.item.setor || "",
        descricao: modal.item.descricao || "",
      });
    } else {
      setForm({ titulo: "", data: "", hora: "", setor: "", descricao: "" });
    }
  }, [modal]);

  const salvar = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      setor: form.setor ? Number(form.setor) : null,
    };
    if (modal.item) {
      await gestaoApi.atualizarAoVivo(modal.item.id, payload);
    } else {
      await gestaoApi.criarAoVivo(payload);
    }
    setModal({ open: false, item: null });
    carregar();
  };

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Treinamentos ao vivo</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, item: null })}>
          Novo treinamento
        </button>
      </div>
      <table className="gestao-table">
        <thead>
          <tr><th>Título</th><th>Data</th><th>Hora</th><th>Setor</th><th></th></tr>
        </thead>
        <tbody>
          {itens.map((t) => (
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>{new Date(t.data).toLocaleDateString("pt-BR")}</td>
              <td>{t.hora?.slice?.(0, 5) || t.hora}</td>
              <td>{t.setor_nome || "—"}</td>
              <td>
                <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: t })}>Editar</button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(t)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? "Editar" : "Novo treinamento"}>
        <form className="gestao-form" onSubmit={salvar}>
          <label>Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <label>Data<input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></label>
          <label>Hora<input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required /></label>
          <label>Setor
            <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
              <option value="">Geral</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </label>
          <label>Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></label>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal({ open: false, item: null })}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => { await gestaoApi.excluirAoVivo(excluir.id); carregar(); }}
        title="Excluir treinamento"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
