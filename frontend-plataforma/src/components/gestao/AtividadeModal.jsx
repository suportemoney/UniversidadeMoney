import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function AtividadeModal({ open, onClose, atividade, onSave }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("quiz");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTitulo(atividade?.titulo || "");
    setTipo(atividade?.tipo || "quiz");
    setErro("");
  }, [atividade, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      await onSave({ titulo, tipo });
      onClose();
    } catch (err) {
      setErro(err.message || "Não foi possível salvar a atividade.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={atividade ? "Editar atividade" : "Nova atividade"}>
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus disabled={salvando} />
        </label>
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={salvando}>
            <option value="quiz">Quiz</option>
            <option value="reflexao">Reflexão</option>
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={salvando}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
