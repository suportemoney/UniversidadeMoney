import { Link } from "react-router-dom";
import Logo from "../Logo";

const NAV = [
  { href: "#beneficios", label: "Benefícios" },
  { href: "#planos", label: "Planos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingHeader() {
  return (
    <header className="landing-header">
      <div className="landing-container landing-header-inner">
        <Logo variant="header" linkTo="/" className="landing-logo" />

        <nav className="landing-nav-pill" aria-label="Navegação principal">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="landing-nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="landing-header-actions">
          <Link to="/login" className="btn btn-outline btn-sm">Entrar</Link>
          <Link to="/cadastro" className="btn btn-primary btn-sm">Criar conta</Link>
          <a href="#planos" className="btn btn-primary btn-sm landing-header-cta">
            Ver planos →
          </a>
        </div>
      </div>
    </header>
  );
}
