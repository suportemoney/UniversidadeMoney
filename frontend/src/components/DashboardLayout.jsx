import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getMe, logout } from "../services/api";
import "../styles/dashboard.css";

const MENU = [
  { to: "/dashboard", label: "Home", icon: "🏠", end: true },
  { to: "/dashboard/meus-cursos", label: "Meus cursos", icon: "📚" },
  { to: "/dashboard/trilhas", label: "Trilhas", icon: "🛤️" },
  { to: "/dashboard/ao-vivo", label: "Treinamentos ao vivo", icon: "🎥" },
  { to: "/dashboard/certificados", label: "Certificados", icon: "🏅" },
  { to: "/dashboard/biblioteca", label: "Biblioteca", icon: "📖" },
  { to: "/dashboard/ranking", label: "Ranking", icon: "🏆" },
  { to: "/dashboard/comunicados", label: "Comunicados", icon: "📢" },
  { to: "/dashboard/progresso", label: "Meu progresso", icon: "📈" },
  { to: "/dashboard/ajuda", label: "Ajuda", icon: "❓" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {
        logout();
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-brand">Universidade Money</div>
        <nav className="dash-nav">
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `dash-nav-item${isActive ? " dash-nav-item--active" : ""}`
              }
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="dash-sidebar-footer">
          <strong>MONEY PROMOTORA</strong>
          <span>Transformamos oportunidades em conquistas.</span>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-header">
          <div className="dash-search">
            <span className="dash-search-icon">🔍</span>
            <input type="search" placeholder="Buscar cursos, trilhas, temas..." />
          </div>
          <div className="dash-header-actions">
            <button type="button" className="dash-notif" aria-label="Notificações">
              🔔
              <span className="dash-notif-badge">3</span>
            </button>
            {user && (
              <div className="dash-profile">
                <div className="dash-avatar">{user.first_name?.charAt(0) || "U"}</div>
                <div className="dash-profile-info">
                  <span>Olá, {user.first_name}</span>
                  <small>{user.cargo || "Colaborador"}</small>
                </div>
              </div>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <main className="dash-content">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
