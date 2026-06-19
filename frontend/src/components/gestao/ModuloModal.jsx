import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function ModuloModal({ open, onClose, modulo, onSave }) {
  const [titulo, setTitulo] = useState("");

  useEffect(() => {
    setTitulo(modulo?.titulo || "");
  }, [modulo, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ titulo });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={modulo ? "Editar módulo" : "Novo módulo"}>
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
