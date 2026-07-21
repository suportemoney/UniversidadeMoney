import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { clearTokens, getMe, login } from "../services/api";

/** Login do painel: CPF ou username + senha. */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [avisoSessao, setAvisoSessao] = useState(!!location.state?.sessaoExpirada);
  const [avisoAcesso, setAvisoAcesso] = useState(!!location.state?.semAcessoPainel);

  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    clearTokens();
    if (location.state?.sessaoExpirada || location.state?.semAcessoPainel) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setAvisoSessao(false);
    setAvisoAcesso(false);
    setLoading(true);
    try {
      clearTokens();
      await login(identificador, password);
      const me = await getMe();
      if (!me.pode_gestao) {
        clearTokens();
        setErro("Esta conta não tem acesso ao painel.");
        return;
      }
      if (me.precisa_redefinir_senha) {
        navigate("/redefinir-senha", { replace: true });
        return;
      }
      if (me.precisa_mfa_painel && !me.mfa_ok) {
        navigate("/mfa", { replace: true });
        return;
      }
      navigate("/gestao", { replace: true });
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

      {avisoSessao && !erro && (
        <div className="alert alert-error">Sessão expirada. Faça login novamente.</div>
      )}
      {avisoAcesso && !erro && (
        <div className="alert alert-error">Esta conta não tem acesso ao painel.</div>
      )}
      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          CPF ou usuário
          <input
            type="text"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            required
            autoComplete="username"
            placeholder="CPF ou username"
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
