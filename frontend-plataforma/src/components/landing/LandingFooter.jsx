import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-grid">
        <div>
          <strong className="landing-footer-brand">Universidade Money</strong>
          <p>Plataforma de aprendizado corporativo da Money Promotora.</p>
        </div>
        <div>
          <h4>Plataforma</h4>
          <ul>
            <li><a href="#beneficios">Benefícios</a></li>
            <li><a href="#planos">Planos</a></li>
            <li><a href="#como-funciona">Como funciona</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4>Acesso</h4>
          <ul>
            <li><Link to="/login">Entrar</Link></li>
            <li><Link to="/cadastro">Criar conta</Link></li>
            <li><Link to="/login?next=/dashboard/ativar-plano">Ativar código</Link></li>
          </ul>
        </div>
        <div>
          <h4>Institucional</h4>
          <ul>
            <li><span>Money Promotora</span></li>
            <li><span>Acesso corporativo por convite</span></li>
          </ul>
        </div>
      </div>
      <div className="landing-container landing-footer-bottom">
        <p>&copy; {new Date().getFullYear()} Money Promotora — Universidade Money</p>
        <button
          type="button"
          className="landing-back-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Voltar ao topo"
        >
          ↑
        </button>
      </div>
    </footer>
  );
}
