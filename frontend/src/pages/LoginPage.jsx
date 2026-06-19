import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setErro(err.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Entrar</h2>
      <p className="auth-subtitle">Acesse sua conta na UniversidadeMoney</p>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="seu@email.com"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="auth-footer">
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </>
  );
}
