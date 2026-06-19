import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title || "Confirmar"}>
      <p>{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmLabel || "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
