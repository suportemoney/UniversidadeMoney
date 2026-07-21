import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "@shared/ui/ThemeToggle.jsx";
import NotificationPanel from "./dashboard/NotificationPanel";
import SearchOverlay from "./dashboard/SearchOverlay";
import NavIcon from "./dashboard/NavIcons";
import { getComunicadosNaoLidos, getMe, logout } from "../services/api";
import Logo from "./Logo";
import { labelNivel } from "../utils/niveisAcesso";
import "../styles/dashboard.css";

const MENU_SECTIONS = [
  {
    id: "aprender",
    label: "Aprender",
    items: [
      { to: "/dashboard", label: "Início", icon: "inicio", end: true },
      {
        to: "/dashboard/explorar",
        label: "Explorar",
        icon: "explorar",
        feature: "acesso_cursos",
        matchPrefixes: ["/dashboard/explorar", "/dashboard/busca"],
      },
      {
        to: "/dashboard/meus-cursos",
        label: "Meus cursos",
        icon: "cursos",
        feature: "acesso_cursos",
        matchPrefixes: ["/dashboard/meus-cursos", "/dashboard/curso", "/dashboard/cursos"],
      },
      {
        to: "/dashboard/trilhas",
        label: "Trilhas",
        icon: "trilhas",
        feature: "acesso_trilhas",
        matchPrefixes: ["/dashboard/trilhas"],
      },
      {
        to: "/dashboard/ao-vivo",
        label: "Ao vivo",
        icon: "aovivo",
        feature: "acesso_ao_vivo",
        matchPrefixes: ["/dashboard/ao-vivo"],
      },
    ],
  },
  {
    id: "espaco",
    label: "Meu espaço",
    items: [
      {
        to: "/dashboard/progresso",
        label: "Meu progresso",
        icon: "progresso",
        matchPrefixes: ["/dashboard/progresso"],
      },
      {
        to: "/dashboard/certificados",
        label: "Certificados",
        icon: "certificados",
        matchPrefixes: ["/dashboard/certificados"],
      },
      {
        to: "/dashboard/biblioteca",
        label: "Biblioteca",
        icon: "biblioteca",
        matchPrefixes: ["/dashboard/biblioteca"],
      },
      {
        to: "/dashboard/comunicados",
        label: "Comunicados",
        icon: "comunicados",
        matchPrefixes: ["/dashboard/comunicados"],
      },
    ],
  },
  {
    id: "suporte",
    label: "Suporte",
    items: [
      {
        to: "/dashboard/ajuda",
        label: "Ajuda",
        icon: "ajuda",
        matchPrefixes: ["/dashboard/ajuda"],
      },
    ],
  },
];

function itemMenuVisivel(item, user) {
  if (!item.feature) return true;
  if (!user) return false;
  if (user.pode_gestao) return true;
  return !!user.features?.[item.feature];
}

function pathCasaComPrefixo(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function itemAtivo(item, pathname) {
  if (item.end) {
    return pathname === item.to || pathname === `${item.to}/`;
  }
  const prefixes = item.matchPrefixes?.length ? item.matchPrefixes : [item.to];
  return prefixes.some((p) => pathCasaComPrefixo(pathname, p));
}

const SIDEBAR_STORAGE_KEY = "dash-sidebar-open";

function lerSidebarInicial() {
  try {
    const salvo = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (salvo === "0") return false;
    if (salvo === "1") return true;
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 769px)").matches;
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [busca, setBusca] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notif, setNotif] = useState({ count: 0, itens: [] });
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(lerSidebarInicial);

  const fecharSidebar = () => persistirSidebar(false);
  const alternarSidebar = () => persistirSidebar(!sidebarOpen);

  function persistirSidebar(aberto) {
    setSidebarOpen(aberto);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, aberto ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

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
  }, [navigate]);

  useEffect(() => {
    if (user) carregarNotif();
  }, [user]);

  useEffect(() => {
    setPerfilOpen(false);
    // No mobile, fecha o drawer ao navegar
    if (isMobileViewport()) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const syncOverflow = () => {
      document.body.style.overflow = sidebarOpen && isMobileViewport() ? "hidden" : "";
    };
    syncOverflow();
    window.addEventListener("resize", syncOverflow);
    return () => {
      window.removeEventListener("resize", syncOverflow);
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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

  const secoesVisiveis = MENU_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => itemMenuVisivel(item, user)),
  })).filter((sec) => sec.items.length > 0);

  const shellClass = ["dash", sidebarOpen ? "dash--sidebar-open" : ""].filter(Boolean).join(" ");

  return (
    <div className={shellClass}>
      {sidebarOpen && (
        <button
          type="button"
          className="dash-sidebar-overlay"
          aria-label="Fechar menu"
          onClick={fecharSidebar}
        />
      )}

      <aside className="dash-sidebar" aria-label="Navegação principal" aria-hidden={!sidebarOpen}>
        <div className="dash-sidebar-top">
          <Logo variant="sidebar" linkTo="/dashboard" className="dash-sidebar-brand" />
        </div>

        <nav className="dash-nav" aria-label="Menu do aluno">
          {secoesVisiveis.map((sec) => (
            <div key={sec.id} className="dash-nav-group">
              <p className="dash-nav-section">{sec.label}</p>
              <ul className="dash-nav-list">
                {sec.items.map((item) => {
                  const ativo = itemAtivo(item, location.pathname);
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        title={item.label}
                        className={`dash-nav-item${ativo ? " dash-nav-item--active" : ""}`}
                        onClick={() => {
                          if (isMobileViewport()) fecharSidebar();
                        }}
                      >
                        <span className="dash-nav-icon" aria-hidden="true">
                          <NavIcon name={item.icon} />
                        </span>
                        <span className="dash-nav-label">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="dash-main">
        <header className="dash-header">
          <button
            type="button"
            className="dash-menu-toggle"
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={sidebarOpen}
            title={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            onClick={alternarSidebar}
          >
            <NavIcon name={sidebarOpen ? "fechar" : "menu"} />
          </button>

          <div className="dash-search">
            <span className="dash-search-icon" aria-hidden="true">
              <NavIcon name="explorar" />
            </span>
            <input
              type="search"
              placeholder="Buscar cursos, trilhas, PDFs, ao vivo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && abrirBusca(busca)}
              disabled={!itemMenuVisivel({ feature: "acesso_cursos" }, user)}
            />
          </div>
          {(user?.pode_gestao || user?.features?.acesso_cursos) && (
            <SearchOverlay query={busca} onVerTodos={() => setBusca("")} />
          )}

          <div className="dash-header-actions">
            <ThemeToggle />
            {user?.pode_gestao && (
              <a
                href={import.meta.env.VITE_PAINEL_URL || "http://localhost:5174"}
                className="btn btn-outline btn-sm"
              >
                Painel
              </a>
            )}
            <button
              type="button"
              className="dash-notif"
              aria-label="Notificações"
              onClick={() => setNotifOpen(true)}
            >
              <NavIcon name="comunicados" />
              {notif.count > 0 && <span className="dash-notif-badge">{notif.count}</span>}
            </button>
            {user && (
              <div className="dash-profile-wrap">
                <button
                  type="button"
                  className="dash-profile"
                  onClick={() => setPerfilOpen((v) => !v)}
                  aria-expanded={perfilOpen}
                >
                  <div className="dash-avatar">{user.first_name?.charAt(0) || "U"}</div>
                  <div className="dash-profile-info">
                    <span>Olá, {user.first_name}</span>
                    <small>{labelNivel(user)}</small>
                  </div>
                </button>
                {perfilOpen && (
                  <div className="dash-profile-menu">
                    <p>
                      <strong>{user.first_name}</strong>
                    </p>
                    <small>{labelNivel(user)}</small>
                    <Link to="/dashboard/progresso" onClick={() => setPerfilOpen(false)}>
                      Meu progresso
                    </Link>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                      Sair
                    </button>
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
