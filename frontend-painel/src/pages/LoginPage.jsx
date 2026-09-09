import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearTokens, getMe, isAuthenticated, login } from "../services/api";
import { destinoAposAuthPainel } from "../utils/posLogin";

/** Login do painel: CPF ou username + senha. Reusa JWT da plataforma no mesmo domínio. */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [avisoSessao, setAvisoSessao] = useState(!!location.state?.sessaoExpirada);
  const [avisoAcesso, setAvisoAcesso] = useState(!!location.state?.semAcessoPainel);

  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [checandoSessao, setChecandoSessao] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function reusarSessao() {
      if (location.state?.sessaoExpirada || location.state?.semAcessoPainel) {
        navigate(location.pathname, { replace: true, state: {} });
      }
      if (!isAuthenticated()) {
        if (!cancelado) setChecandoSessao(false);
        return;
      }
      try {
        const me = await getMe();
        if (cancelado) return;
        if (me?.pode_gestao) {
          navigate(destinoAposAuthPainel(me), { replace: true });
          return;
        }
      } catch {
        /* token inválido: mostra o formulário sem apagar à toa */
      }
      if (!cancelado) setChecandoSessao(false);
    }
    reusarSessao();
    return () => {
      cancelado = true;
    };
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setAvisoSessao(false);
    setAvisoAcesso(false);
    setLoading(true);
    try {
      await login(identificador, password);
      const me = await getMe();
      if (!me.pode_gestao) {
        clearTokens();
        setErro("Esta conta não tem acesso ao painel.");
        return;
      }
      navigate(destinoAposAuthPainel(me), { replace: true });
    } catch (err) {
      setErro(err.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  if (checandoSessao) {
    return <p className="auth-subtitle">Verificando sessão...</p>;
  }

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
      <p className="auth-footer">
        <Link to="/recuperar-senha">Esqueci a senha</Link>
      </p>
    </>
  );
}
