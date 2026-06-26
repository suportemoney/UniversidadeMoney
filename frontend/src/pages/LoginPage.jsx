import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, getMe } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.message;
  const sessaoExpirada = location.state?.sessaoExpirada;

  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(identificador, password);
      const me = await getMe();
      const destino = location.state?.from?.pathname;
      if (me.pode_gestao || me.tem_plano) {
        navigate(destino || "/dashboard");
      } else {
        navigate("/dashboard/ativar-plano");
      }
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
      {sessaoExpirada && (
        <div className="alert alert-error">Sessão expirada. Faça login novamente.</div>
      )}
      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          E-mail ou usuário
          <input
            type="text"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
            autoComplete="username"
            placeholder="seu@email.com ou usuário admin"
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
