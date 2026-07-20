import { Link } from "react-router-dom";

export default function GestaoRecentList({
  title,
  emptyText = "Nenhum item recente.",
  items = [],
  renderItem,
  footerLink,
  footerLabel = "Ver todos",
  delay = 0,
}) {
  return (
    <div className="gestao-dashboard-panel gestao-animate-in" style={{ animationDelay: `${delay}ms` }}>
      <h3 className="gestao-dashboard-panel-title">{title}</h3>
      {items.length === 0 ? (
        <p className="gestao-muted">{emptyText}</p>
      ) : (
        <ul className="gestao-recent-list">
          {items.map((item) => (
            <li key={item.id} className="gestao-recent-item">
              {renderItem(item)}
            </li>
          ))}
        </ul>
      )}
      {footerLink && (
        <Link to={footerLink} className="gestao-recent-footer">
          {footerLabel} →
        </Link>
      )}
    </div>
  );
}
