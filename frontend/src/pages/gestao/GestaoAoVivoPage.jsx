import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoAoVivoPage() {
  const [itens, setItens] = useState([]);
  const [setores, setSetores] = useState([]);
  const [tags, setTags] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState({
    titulo: "", data: "", hora: "", setor: "", descricao: "", tag_ids: [],
  });

  const carregar = () => gestaoApi.listarAoVivo().then(setItens);

  useEffect(() => {
    carregar();
    gestaoApi.setores().then(setSetores);
    gestaoApi.listarTags().then(setTags);
  }, []);

  useEffect(() => {
    if (modal.item) {
      const tagIds = (modal.item.tags || []).map((t) => (typeof t === "object" ? t.id : t));
      setForm({
        titulo: modal.item.titulo,
        data: modal.item.data,
        hora: modal.item.hora?.slice(0, 5) || modal.item.hora,
        setor: modal.item.setor || "",
        descricao: modal.item.descricao || "",
        tag_ids: tagIds,
      });
    } else {
      setForm({ titulo: "", data: "", hora: "", setor: "", descricao: "", tag_ids: [] });
    }
  }, [modal]);

  const salvar = async (e) => {
    e.preventDefault();
    const payload = {
      titulo: form.titulo,
      data: form.data,
      hora: form.hora,
      descricao: form.descricao,
      setor: form.setor ? Number(form.setor) : null,
      tag_ids: form.tag_ids,
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
          <tr><th>Título</th><th>Data</th><th>Hora</th><th>Setor</th><th>Tags</th><th></th></tr>
        </thead>
        <tbody>
          {itens.map((t) => (
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>{new Date(t.data).toLocaleDateString("pt-BR")}</td>
              <td>{t.hora?.slice?.(0, 5) || t.hora}</td>
              <td>{t.setor_nome || "—"}</td>
              <td>{t.tags?.map((tag) => tag.nome).join(", ") || "—"}</td>
              <td>
                <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: t })}>Editar</button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(t)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? "Editar" : "Novo treinamento"} wide>
        <form className="gestao-form gestao-form--modal" onSubmit={salvar}>
          <label className="gestao-field">Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <div className="gestao-form-row gestao-form-row--2">
            <label className="gestao-field">Data<input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></label>
            <label className="gestao-field">Hora<input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required /></label>
          </div>
          <label className="gestao-field">Setor
            <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
              <option value="">Geral</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </label>
          <label className="gestao-field">Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></label>
          <div className="gestao-form-section">
            <h3 className="gestao-form-section-title">Tags</h3>
            {tags.length === 0 ? (
              <p className="gestao-muted">Nenhuma tag cadastrada.</p>
            ) : (
              <div className="gestao-features-grid">
                {tags.filter((t) => t.ativo).map((t) => (
                  <label key={t.id} className="gestao-feature-card">
                    <input
                      type="checkbox"
                      checked={form.tag_ids.includes(t.id)}
                      onChange={() => {
                        const ids = form.tag_ids.includes(t.id)
                          ? form.tag_ids.filter((id) => id !== t.id)
                          : [...form.tag_ids, t.id];
                        setForm({ ...form, tag_ids: ids });
                      }}
                    />
                    <span>{t.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
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
