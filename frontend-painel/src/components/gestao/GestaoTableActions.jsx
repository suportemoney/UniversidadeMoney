import { Link } from "react-router-dom";
import GestaoIcon from "./GestaoIcons";

export default function GestaoTableActions({
  editTo,
  onEdit,
  onView,
  onDelete,
  onInativar,
  editLabel = "Editar",
  viewLabel = "Visualizar",
  deleteLabel = "Excluir",
  inativarLabel = "Inativar",
  center = false,
}) {
  return (
    <div
      className={`gestao-table-actions${center ? " gestao-table-actions--center" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {onView && (
        <button
          type="button"
          className="gestao-icon-btn"
          title={viewLabel}
          aria-label={viewLabel}
          onClick={onView}
        >
          <GestaoIcon name="olho" />
        </button>
      )}
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
      {onInativar && (
        <button
          type="button"
          className="gestao-icon-btn"
          title={inativarLabel}
          aria-label={inativarLabel}
          onClick={onInativar}
        >
          <GestaoIcon name="inativar" />
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
