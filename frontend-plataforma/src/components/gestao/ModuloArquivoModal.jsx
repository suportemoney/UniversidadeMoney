import { useEffect, useState } from "react";
import Modal from "../ui/Modal";

export default function ModuloArquivoModal({ open, onClose, onSave }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("pdf");
  const [arquivo, setArquivo] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTitulo("");
    setTipo("pdf");
    setArquivo(null);
    setErro("");
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!arquivo) {
      setErro("Selecione um arquivo.");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await onSave({ titulo, tipo, arquivo });
      onClose();
    } catch (err) {
      setErro(err.message || "Não foi possível enviar o arquivo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Adicionar apostila">
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      <form className="gestao-form" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus disabled={salvando} />
        </label>
        <label>
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={salvando}>
            <option value="pdf">PDF</option>
            <option value="audio">Áudio</option>
          </select>
        </label>
        <label>
          Arquivo
          <input
            type="file"
            accept={tipo === "pdf" ? ".pdf" : ".mp3,.wav,.ogg,.m4a,.aac"}
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            disabled={salvando}
            required
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={salvando}>Cancelar</button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={salvando}>
            {salvando ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
