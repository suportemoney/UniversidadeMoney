import { Link } from "react-router-dom";
import useGestaoBreadcrumb from "../../hooks/useGestaoBreadcrumb";

export default function GestaoBreadcrumb() {
  const { area, crumbs } = useGestaoBreadcrumb();

  return (
    <nav className="gestao-breadcrumb" aria-label="Navegação">
      <span className="gestao-breadcrumb-area">{area}</span>
      {crumbs.length > 0 && (
        <ol className="gestao-breadcrumb-list">
          {crumbs.map((crumb, i) => (
            <li key={crumb.label}>
              {i > 0 && <span className="gestao-breadcrumb-sep">/</span>}
              {crumb.to ? (
                <Link to={crumb.to}>{crumb.label}</Link>
              ) : (
                <span className="gestao-breadcrumb-current">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
