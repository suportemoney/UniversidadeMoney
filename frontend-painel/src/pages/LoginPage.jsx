import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMe, login } from "../services/api";

/** Login do painel: username/e-mail + senha (equipe). */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
      if (!me.pode_gestao) {
        setErro("Esta conta não tem acesso ao painel.");
        return;
      }
      navigate(location.state?.from?.pathname || "/gestao");
    } catch (err) {
      setErro(err.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Painel interno</h2>
      <p className="auth-subtitle">Acesso para administração, instrutores e TI</p>

      {sessaoExpirada && (
        <div className="alert alert-error">Sessão expirada. Faça login novamente.</div>
      )}
      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Usuário ou e-mail
          <input
            type="text"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
            autoComplete="username"
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
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </>
  );
}
