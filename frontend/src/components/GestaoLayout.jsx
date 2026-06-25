import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { getMe, logout } from "../services/api";
import Logo from "./Logo";
import GestaoBreadcrumb from "./gestao/GestaoBreadcrumb";
import GestaoIcon from "./gestao/GestaoIcons";
import "../styles/gestao.css";

const MENU = [
  { to: "/gestao", label: "Resumo", icon: "resumo", end: true },
  { to: "/gestao/cursos", label: "Cursos", icon: "cursos" },
  { to: "/gestao/setores", label: "Setores", icon: "setores" },
  { to: "/gestao/trilhas", label: "Trilhas", icon: "trilhas" },
  { to: "/gestao/comunicados", label: "Comunicados", icon: "comunicados" },
  { to: "/gestao/ao-vivo", label: "Ao vivo", icon: "aoVivo" },
  { to: "/gestao/biblioteca", label: "Biblioteca", icon: "biblioteca" },
  { to: "/gestao/landing", label: "Landing", icon: "landing" },
  { to: "/gestao/planos", label: "Planos", icon: "planos" },
  { to: "/gestao/tags", label: "Tags", icon: "tags" },
  { to: "/gestao/tokens", label: "Tokens", icon: "tokens" },
  { to: "/gestao/equipe", label: "Equipe", icon: "equipe", superOnly: true },
];

export default function GestaoLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getMe().then(setUser).catch(() => navigate("/login"));
  }, [navigate]);

  useEffect(() => {
    const fechar = () => setPerfilOpen(false);
    if (perfilOpen) document.addEventListener("click", fechar);
    return () => document.removeEventListener("click", fechar);
  }, [perfilOpen]);

  const iniciais = useMemo(() => {
    const nome = user?.first_name || user?.username || "U";
    return nome.charAt(0).toUpperCase();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fecharSidebar = () => setSidebarOpen(false);

  return (
    <div className={`gestao${sidebarOpen ? " gestao--sidebar-open" : ""}`}>
      {sidebarOpen && (
        <button
          type="button"
          className="gestao-sidebar-overlay"
          aria-label="Fechar menu"
          onClick={fecharSidebar}
        />
      )}

      <aside className="gestao-sidebar">
        <Logo variant="sidebar" linkTo="/gestao" className="gestao-brand" />
        <nav className="gestao-nav" aria-label="Menu de gestão">
          {MENU.filter((m) => !m.superOnly || user?.is_superuser).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `gestao-nav-item${isActive ? " active" : ""}`}
              onClick={fecharSidebar}
            >
              <GestaoIcon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <Link to="/dashboard" className="gestao-back" onClick={fecharSidebar}>
          <GestaoIcon name="voltar" />
          Voltar ao painel
        </Link>
      </aside>

      <div className="gestao-main">
        <header className="gestao-header">
          <div className="gestao-header-left">
            <button
              type="button"
              className="gestao-menu-toggle"
              aria-label="Abrir menu"
              onClick={() => setSidebarOpen(true)}
            >
              <GestaoIcon name="menu" />
            </button>
            <GestaoBreadcrumb />
          </div>

          <div className="gestao-header-actions">
            <button type="button" className="gestao-notif-btn" aria-label="Notificações">
              <GestaoIcon name="sino" />
            </button>

            {user && (
              <div
                className="gestao-profile-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="gestao-profile"
                  onClick={() => setPerfilOpen((v) => !v)}
                >
                  <div className="gestao-avatar">{iniciais}</div>
                  <div className="gestao-profile-info">
                    <span>{user.first_name || "Administrador"}</span>
                    <small>{user.is_superuser ? "Superusuário" : "Gestor"}</small>
                  </div>
                </button>
                {perfilOpen && (
                  <div className="gestao-profile-menu">
                    <p><strong>{user.first_name}</strong></p>
                    <small>{user.email}</small>
                    <Link to="/dashboard" onClick={() => setPerfilOpen(false)}>Ir ao painel</Link>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="gestao-content gestao-fade-in">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
