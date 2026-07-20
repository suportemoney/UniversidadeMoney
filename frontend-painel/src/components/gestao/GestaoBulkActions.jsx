export default function GestaoBulkActions({
  count,
  actionLabel = "Excluir selecionados",
  onAction,
  onClear,
  loading = false,
  variant = "danger",
}) {
  if (!count) return null;

  return (
    <div className="gestao-bulk-actions gestao-animate-in" role="toolbar" aria-label="Ações em lote">
      <span className="gestao-bulk-actions-count">
        {count} selecionado{count !== 1 ? "s" : ""}
      </span>
      <button
        type="button"
        className={`btn btn-sm ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
        onClick={onAction}
        disabled={loading}
      >
        {loading ? "Processando..." : actionLabel}
      </button>
      <button type="button" className="btn btn-outline btn-sm" onClick={onClear} disabled={loading}>
        Limpar seleção
      </button>
    </div>
  );
}
