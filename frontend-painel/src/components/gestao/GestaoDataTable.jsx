import GestaoEmptyState from "./GestaoEmptyState";

function SkeletonRows({ cols = 5, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="gestao-table-skeleton-row">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j}><span className="gestao-skeleton" /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function GestaoDataTable({
  loading,
  empty,
  emptyTitle = "Nenhum item encontrado",
  emptyMessage,
  emptyAction,
  skeletonCols = 5,
  footer,
  children,
}) {
  return (
    <div className="gestao-table-card gestao-animate-in gestao-animate-in--delay-2">
      {!loading && empty ? (
        <GestaoEmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
      ) : (
        <div className="gestao-table-wrap">
          <table className="gestao-table gestao-table--v2">
            {children}
          </table>
          {loading && (
            <table className="gestao-table gestao-table--v2 gestao-table--overlay">
              <tbody>
                <SkeletonRows cols={skeletonCols} />
              </tbody>
            </table>
          )}
        </div>
      )}
      {footer}
    </div>
  );
}

export function GestaoTableRow({ index = 0, children, className = "", selected = false, onClick }) {
  const style = { animationDelay: `${Math.min(index, 12) * 40}ms` };
  const selectedClass = selected ? " gestao-table-row--selected" : "";
  return (
    <tr
      className={`gestao-table-row-in${selectedClass}${className ? ` ${className}` : ""}${onClick ? " gestao-table-row--clickable" : ""}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function GestaoCellCurso({ cor, titulo, descricao }) {
  const cores = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ec4899"];
  const bg = cor || cores[(titulo?.length || 0) % cores.length];

  return (
    <div className="gestao-cell-curso">
      <div className="gestao-cell-curso-icon" style={{ background: `${bg}22`, color: bg }}>
        <span>{titulo?.charAt(0)?.toUpperCase() || "C"}</span>
      </div>
      <div className="gestao-cell-curso-text">
        <strong>{titulo}</strong>
        {descricao && <span>{descricao}</span>}
      </div>
    </div>
  );
}
