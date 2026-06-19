import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import NotificationPanel from "./dashboard/NotificationPanel";
import SearchOverlay from "./dashboard/SearchOverlay";
import { getComunicadosNaoLidos, getMe, logout } from "../services/api";
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
  const [busca, setBusca] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notif, setNotif] = useState({ count: 0, itens: [] });
  const [perfilOpen, setPerfilOpen] = useState(false);

  const carregarNotif = () => {
    getComunicadosNaoLidos().then(setNotif).catch(() => setNotif({ count: 0, itens: [] }));
  };

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {
        logout();
        navigate("/login");
      });
    carregarNotif();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const abrirBusca = (termo) => {
    const q = termo.trim();
    if (q.length >= 2) {
      navigate(`/dashboard/busca?q=${encodeURIComponent(q)}`);
      setBusca("");
    }
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
      </aside>

      <div className="dash-main">
        <header className="dash-header">
          <div className="dash-search">
            <span className="dash-search-icon">🔍</span>
            <input
              type="search"
              placeholder="Buscar cursos, trilhas, PDFs, ao vivo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && abrirBusca(busca)}
            />
          </div>
          <SearchOverlay query={busca} onVerTodos={() => setBusca("")} />

          <div className="dash-header-actions">
            {user?.pode_gestao && (
              <NavLink to="/gestao" className="btn btn-outline btn-sm">
                Gestão
              </NavLink>
            )}
            <button
              type="button"
              className="dash-notif"
              aria-label="Notificações"
              onClick={() => setNotifOpen(true)}
            >
              🔔
              {notif.count > 0 && <span className="dash-notif-badge">{notif.count}</span>}
            </button>
            {user && (
              <div className="dash-profile-wrap">
                <button
                  type="button"
                  className="dash-profile"
                  onClick={() => setPerfilOpen((v) => !v)}
                >
                  <div className="dash-avatar">{user.first_name?.charAt(0) || "U"}</div>
                  <div className="dash-profile-info">
                    <span>Olá, {user.first_name}</span>
                    <small>{user.cargo || "Colaborador"}</small>
                  </div>
                </button>
                {perfilOpen && (
                  <div className="dash-profile-menu">
                    <p><strong>{user.first_name}</strong></p>
                    <small>{user.cargo || "Colaborador"}</small>
                    <Link to="/dashboard/progresso" onClick={() => setPerfilOpen(false)}>Meu progresso</Link>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>Sair</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="dash-content">
          <Outlet context={{ user }} />
        </main>
      </div>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        itens={notif.itens}
        onAtualizar={carregarNotif}
      />
    </div>
  );
}
