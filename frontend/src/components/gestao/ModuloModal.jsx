import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

const TIPOS = [
  { value: "texto", label: "O que você vai aprender (texto)" },
  { value: "apostila", label: "Apostilas (PDF ou áudio)" },
  { value: "video", label: "Videoaulas" },
];

export default function ModuloModal({ open, onClose, modulo, onSave }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("video");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTitulo(modulo?.titulo || "");
    setTipo(modulo?.tipo || "video");
    setErro("");
  }, [modulo, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    try {
      const payload = { titulo };
      if (!modulo) payload.tipo = tipo;
      await onSave(payload);
      onClose();
    } catch (err) {
      setErro(err.message || "Não foi possível salvar o módulo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={modulo ? "Editar módulo" : "Novo módulo"}>
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus disabled={salvando} />
        </label>
        <label>
          Tipo de conteúdo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={salvando || !!modulo}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {modulo && <small className="gestao-muted">O tipo não pode ser alterado após a criação.</small>}
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
