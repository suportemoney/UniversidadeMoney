import { Link } from "react-router-dom";
import GestaoIcon from "./GestaoIcons";

export default function GestaoTableActions({ editTo, onEdit, onDelete, editLabel = "Editar", deleteLabel = "Excluir" }) {
  return (
    <div className="gestao-table-actions">
      {editTo && (
        <Link to={editTo} className="gestao-icon-btn" title={editLabel} aria-label={editLabel}>
          <GestaoIcon name="editar" />
        </Link>
      )}
      {onEdit && !editTo && (
        <button type="button" className="gestao-icon-btn" title={editLabel} aria-label={editLabel} onClick={onEdit}>
          <GestaoIcon name="editar" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="gestao-icon-btn gestao-icon-btn--danger"
          title={deleteLabel}
          aria-label={deleteLabel}
          onClick={onDelete}
        >
          <GestaoIcon name="excluir" />
        </button>
      )}
    </div>
  );
}
