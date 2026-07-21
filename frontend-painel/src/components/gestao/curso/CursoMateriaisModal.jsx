import { useState } from "react";
import Modal from "../../ui/Modal";
import GestaoIcon from "../GestaoIcons";
import { gestaoApi } from "../../../services/gestaoApi";

/** Modal flutuante para gerenciar PDFs de apoio do curso. */
export default function CursoMateriaisModal({ open, onClose, cursoId, materiais = [], onChanged }) {
  const [titulo, setTitulo] = useState("");
  const [file, setFile] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!file || !titulo.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      await gestaoApi.uploadMaterial(cursoId, file, titulo.trim());
      setTitulo("");
      setFile(null);
      onChanged?.();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id) => {
    if (!window.confirm("Excluir este material?")) return;
    try {
      await gestaoApi.excluirMaterial(id);
      onChanged?.();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Material de apoio"
      wide
      footer={(
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Fechar
        </button>
      )}
    >
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}

      <p className="gestao-muted" style={{ marginTop: 0 }}>
        PDFs opcionais disponíveis para o aluno no início do curso.
      </p>

      <ul className="curso-expand-list">
        {materiais.length === 0 && (
          <li className="gestao-muted">Nenhum material cadastrado.</li>
        )}
        {materiais.map((m) => (
          <li key={m.id}>
            <a href={m.arquivo_url} target="_blank" rel="noreferrer">{m.titulo}</a>
            <button
              type="button"
              className="gestao-icon-btn gestao-icon-btn--danger"
              onClick={() => excluir(m.id)}
              title="Excluir"
            >
              <GestaoIcon name="excluir" />
            </button>
          </li>
        ))}
      </ul>

      <form className="gestao-form gestao-form--modal" onSubmit={enviar}>
        <label className="gestao-field">
          Título
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Apostila do módulo 1"
            required
          />
        </label>
        <label className="gestao-field">
          Arquivo PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={salvando || !file || !titulo.trim()}
        >
          {salvando ? "Enviando..." : "Adicionar PDF"}
        </button>
      </form>
    </Modal>
  );
}
