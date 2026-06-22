import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { getMe, logout } from "../services/api";
import "../styles/gestao.css";

const MENU = [
  { to: "/gestao", label: "Resumo", end: true },
  { to: "/gestao/cursos", label: "Cursos" },
  { to: "/gestao/trilhas", label: "Trilhas" },
  { to: "/gestao/comunicados", label: "Comunicados" },
  { to: "/gestao/ao-vivo", label: "Ao vivo" },
  { to: "/gestao/biblioteca", label: "Biblioteca" },
  { to: "/gestao/planos", label: "Planos" },
  { to: "/gestao/tags", label: "Tags" },
  { to: "/gestao/tokens", label: "Tokens" },
  { to: "/gestao/equipe", label: "Equipe", superOnly: true },
];

export default function GestaoLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => navigate("/login"));
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="gestao">
      <aside className="gestao-sidebar">
        <div className="gestao-brand">Gestão — Universidade Money</div>
        <nav className="gestao-nav">
          {MENU.filter((m) => !m.superOnly || user?.is_superuser).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `gestao-nav-item${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/dashboard" className="gestao-back">← Voltar ao painel</Link>
      </aside>

      <div className="gestao-main">
        <header className="gestao-header">
          <span className="gestao-header-title">Área de gestão de conteúdo</span>
          <div className="gestao-header-actions">
            {user && <span>{user.first_name}</span>}
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>
        <main className="gestao-content">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
