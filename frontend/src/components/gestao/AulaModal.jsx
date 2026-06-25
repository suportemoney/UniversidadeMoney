import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function AulaModal({ open, onClose, aula, onSave }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [obrigatoria, setObrigatoria] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTitulo(aula?.titulo || "");
    setDescricao(aula?.descricao || "");
    setObrigatoria(aula?.obrigatoria ?? true);
    setErro("");
  }, [aula, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      await onSave({ titulo, descricao, obrigatoria });
      onClose();
    } catch (err) {
      setErro(err.message || "Não foi possível salvar a aula.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={aula ? "Editar aula" : "Nova aula"}>
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus disabled={salvando} />
        </label>
        <label>
          Descrição
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} disabled={salvando} />
        </label>
        <label className="gestao-check">
          <input
            type="checkbox"
            checked={obrigatoria}
            onChange={(e) => setObrigatoria(e.target.checked)}
            disabled={salvando}
          />
          Aula obrigatória
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
