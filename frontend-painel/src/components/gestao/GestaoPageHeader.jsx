import GestaoIcon from "./GestaoIcons";

export default function GestaoPageHeader({ icon, title, subtitle, children }) {
  return (
    <header className="gestao-page-header-v2 gestao-animate-in">
      <div className="gestao-page-header-v2-main">
        {icon && (
          <div className="gestao-page-header-v2-icon">
            <GestaoIcon name={icon} />
          </div>
        )}
        <div>
          <h1 className="gestao-page-title">{title}</h1>
          {subtitle && <p className="gestao-page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="gestao-page-header-v2-actions">{children}</div>}
    </header>
  );
}
