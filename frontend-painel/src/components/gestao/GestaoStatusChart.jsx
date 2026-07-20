export default function GestaoStatusChart({ title = "Cursos por status", items = [] }) {
  const max = Math.max(...items.map((i) => i.total), 1);

  if (!items.length) {
    return (
      <div className="gestao-dashboard-panel gestao-animate-in">
        <h3 className="gestao-dashboard-panel-title">{title}</h3>
        <p className="gestao-muted">Nenhum dado disponível.</p>
      </div>
    );
  }

  return (
    <div className="gestao-dashboard-panel gestao-animate-in">
      <h3 className="gestao-dashboard-panel-title">{title}</h3>
      <div className="gestao-status-chart">
        {items.map((item) => {
          const pct = item.total > 0 ? Math.round((item.total / max) * 100) : 0;
          return (
            <div key={item.status} className="gestao-status-bar">
              <div className="gestao-status-bar-header">
                <span>{item.label}</span>
                <strong>{item.total}</strong>
              </div>
              <div className="gestao-status-bar-track">
                <div
                  className={`gestao-status-bar-fill gestao-status-bar-fill--${item.status}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
