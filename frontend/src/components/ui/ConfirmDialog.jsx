import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel, danger }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || "Confirmar"}
      footer={(
        <>
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
        </>
      )}
    >
      <p className="modal-confirm-message">{message}</p>
    </Modal>
  );
}
