import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getMe, logout } from "../services/api";
import Logo from "./Logo";
import GestaoBreadcrumb from "./gestao/GestaoBreadcrumb";
import GestaoIcon from "./gestao/GestaoIcons";
import { itemMenuPermitido, labelNivel } from "../utils/niveisAcesso";
import "../styles/gestao.css";

const MENU_SECOES = [
  {
    titulo: "Visão geral",
    itens: [{ to: "/gestao", label: "Resumo", icon: "resumo", end: true, instrutorOk: true }],
  },
  {
    titulo: "Acesso e integração",
    itens: [
      { to: "/gestao/convites", label: "Convites", icon: "tokens", convitesOnly: true },
      { to: "/gestao/api", label: "API", icon: "api", apiOnly: true },
      { to: "/gestao/equipe", label: "Equipe", icon: "equipe", adminOnly: true },
    ],
  },
  {
    titulo: "Conteúdo",
    itens: [
      { to: "/gestao/cursos", label: "Cursos", icon: "cursos", instrutorOk: true },
      { to: "/gestao/trilhas", label: "Trilhas", icon: "trilhas" },
      { to: "/gestao/ao-vivo", label: "Ao vivo", icon: "aoVivo" },
      { to: "/gestao/biblioteca", label: "Biblioteca", icon: "biblioteca" },
      { to: "/gestao/comunicados", label: "Comunicados", icon: "comunicados" },
    ],
  },
  {
    titulo: "Organização",
    itens: [
      { to: "/gestao/setores", label: "Setores", icon: "setores" },
      { to: "/gestao/tags", label: "Tags", icon: "tags" },
    ],
  },
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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setPerfilOpen(false);
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const iniciais = useMemo(() => {
    const nome = user?.first_name || user?.username || "U";
    return nome.charAt(0).toUpperCase();
  }, [user]);

  const papel = labelNivel(user);

  const secoesVisiveis = useMemo(
    () =>
      MENU_SECOES.map((sec) => ({
        ...sec,
        itens: sec.itens.filter((m) => itemMenuPermitido(m, user)),
      })).filter((sec) => sec.itens.length > 0),
    [user]
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fecharSidebar = () => setSidebarOpen(false);
  const plataformaUrl = import.meta.env.VITE_PLATAFORMA_URL || "http://localhost:5173";

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

      <aside className="gestao-sidebar" aria-label="Navegação principal">
        <div className="gestao-sidebar-top">
          <Logo variant="sidebar" linkTo="/gestao" className="gestao-brand" />
          <p className="gestao-sidebar-tagline">Painel interno</p>
        </div>

        <nav className="gestao-nav" aria-label="Menu de gestão">
          {secoesVisiveis.map((sec) => (
            <div key={sec.titulo} className="gestao-nav-section">
              <p className="gestao-nav-section-title">{sec.titulo}</p>
              <ul className="gestao-nav-list">
                {sec.itens.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `gestao-nav-item${isActive ? " active" : ""}`
                      }
                      onClick={fecharSidebar}
                    >
                      <span className="gestao-nav-icon" aria-hidden="true">
                        <GestaoIcon name={item.icon} />
                      </span>
                      <span className="gestao-nav-label">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="gestao-sidebar-foot">
          <a
            href={plataformaUrl}
            className="gestao-back"
            onClick={fecharSidebar}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GestaoIcon name="voltar" />
            <span>
              Ir à plataforma
              <small>Abre em nova aba</small>
            </span>
          </a>
        </div>
      </aside>

      <div className="gestao-main">
        <header className="gestao-header">
          <div className="gestao-header-left">
            <button
              type="button"
              className="gestao-menu-toggle"
              aria-label="Abrir menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <GestaoIcon name="menu" />
            </button>
            <GestaoBreadcrumb />
          </div>

          <div className="gestao-header-actions">
            {user && (
              <div
                className="gestao-profile-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={`gestao-profile${perfilOpen ? " gestao-profile--open" : ""}`}
                  onClick={() => setPerfilOpen((v) => !v)}
                  aria-expanded={perfilOpen}
                  aria-haspopup="menu"
                >
                  <div className="gestao-avatar" aria-hidden="true">
                    {iniciais}
                  </div>
                  <div className="gestao-profile-info">
                    <span>{user.first_name || user.username || "Administrador"}</span>
                    <small>{papel}</small>
                  </div>
                  <span className="gestao-profile-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>
                {perfilOpen && (
                  <div className="gestao-profile-menu" role="menu">
                    <div className="gestao-profile-menu-head">
                      <div className="gestao-avatar gestao-avatar--lg" aria-hidden="true">
                        {iniciais}
                      </div>
                      <div>
                        <p>
                          <strong>{user.first_name || user.username}</strong>
                        </p>
                        <small>{user.email || user.username}</small>
                        <span className="gestao-role-pill">{papel}</span>
                      </div>
                    </div>
                    <div className="gestao-profile-menu-actions">
                      <a
                        href={plataformaUrl}
                        className="gestao-profile-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                      >
                        Abrir plataforma
                      </a>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm gestao-logout-btn"
                        onClick={handleLogout}
                        role="menuitem"
                      >
                        Sair da conta
                      </button>
                    </div>
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
