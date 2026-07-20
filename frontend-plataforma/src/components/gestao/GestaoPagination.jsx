export default function GestaoPagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (!totalItems) return null;

  const inicio = (page - 1) * pageSize + 1;
  const fim = Math.min(page * pageSize, totalItems);

  const paginas = [];
  for (let i = 1; i <= totalPages; i += 1) {
    paginas.push(i);
  }

  return (
    <footer className="gestao-pagination">
      <span className="gestao-pagination-info">
        Exibindo {inicio} a {fim} de {totalItems}
      </span>
      {totalPages > 1 && (
        <div className="gestao-pagination-controls">
          <button
            type="button"
            className="gestao-pagination-btn"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            ‹
          </button>
          {paginas.map((p) => (
            <button
              key={p}
              type="button"
              className={`gestao-pagination-btn${p === page ? " gestao-pagination-btn--active" : ""}`}
              onClick={() => onPageChange(p)}
              aria-label={`Página ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="gestao-pagination-btn"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Próxima página"
          >
            ›
          </button>
        </div>
      )}
    </footer>
  );
}
