import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function ParticipanteModal({ open, onClose, participante, onSave }) {
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setNome(participante?.nome || "");
    setCargo(participante?.cargo || "");
    setErro("");
  }, [participante, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      await onSave({ nome, cargo });
      onClose();
    } catch (err) {
      setErro(err.message || "Não foi possível salvar o participante.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={participante ? "Editar participante" : "Novo participante"}>
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus disabled={salvando} />
        </label>
        <label>
          Cargo (opcional)
          <input value={cargo} onChange={(e) => setCargo(e.target.value)} disabled={salvando} placeholder="Ex.: Convidado especial" />
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
