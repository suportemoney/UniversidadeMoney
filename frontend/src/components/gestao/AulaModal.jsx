import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function AulaModal({ open, onClose, aula, onSave }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [obrigatoria, setObrigatoria] = useState(true);

  useEffect(() => {
    setTitulo(aula?.titulo || "");
    setDescricao(aula?.descricao || "");
    setObrigatoria(aula?.obrigatoria ?? true);
  }, [aula, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ titulo, descricao, obrigatoria });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={aula ? "Editar aula" : "Nova aula"}>
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus />
        </label>
        <label>
          Descrição
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />
        </label>
        <label className="gestao-check">
          <input type="checkbox" checked={obrigatoria} onChange={(e) => setObrigatoria(e.target.checked)} />
          Aula obrigatória
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
