import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMe, isAuthenticated, logout } from "../services/api";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated()) {
      getMe()
        .then(setUser)
        .catch(() => logout());
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <div className="home">
      <header className="home-header">
        <span className="logo">UniversidadeMoney</span>
        <nav className="home-nav">
          {user ? (
            <>
              <span className="user-greeting">Olá, {user.first_name}</span>
              <button type="button" className="btn btn-outline" onClick={handleLogout}>
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Entrar
              </Link>
              <Link to="/cadastro" className="btn btn-primary">
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="hero">
        <h1>Sua plataforma de aprendizado</h1>
        <p>
          Cursos, conteúdos e trilhas para evoluir na Money Promotora.
          Cadastre-se e comece agora.
        </p>
        {!user && (
          <div className="hero-actions">
            <Link to="/cadastro" className="btn btn-primary btn-lg">
              Começar gratuitamente
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Já tenho conta
            </Link>
          </div>
        )}
      </main>

      <section className="features">
        <div className="feature-card">
          <h3>Cursos online</h3>
          <p>Conteúdo disponível quando e onde você precisar.</p>
        </div>
        <div className="feature-card">
          <h3>Trilhas de carreira</h3>
          <p>Aprenda no ritmo certo para sua evolução profissional.</p>
        </div>
        <div className="feature-card">
          <h3>Certificados</h3>
          <p>Comprove seu progresso ao concluir cada módulo.</p>
        </div>
      </section>

      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Money Promotora — UniversidadeMoney</p>
      </footer>
    </div>
  );
}
