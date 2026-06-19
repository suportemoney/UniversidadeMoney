import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function AtividadeModal({ open, onClose, atividade, onSave }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("quiz");

  useEffect(() => {
    setTitulo(atividade?.titulo || "");
    setTipo(atividade?.tipo || "quiz");
  }, [atividade, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ titulo, tipo });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={atividade ? "Editar atividade" : "Nova atividade"}>
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus />
        </label>
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="quiz">Quiz</option>
            <option value="reflexao">Reflexão</option>
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
