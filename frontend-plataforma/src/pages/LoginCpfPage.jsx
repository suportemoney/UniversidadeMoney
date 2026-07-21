import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getMe, login } from "../services/api";

export default function LoginCpfPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const ativado = params.get("ativado") === "1";
  const sessaoExpirada = location.state?.sessaoExpirada;

  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const internoUrl = useMemo(
    () => import.meta.env.VITE_INTERNO_URL || "http://localhost:5175",
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await login(identificador, password);
      const me = await getMe();
      if (me.precisa_redefinir_senha) {
        navigate("/redefinir-senha", { replace: true });
        return;
      }
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (err) {
      setErro(err.message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Entrar na plataforma</h2>
      <p className="auth-subtitle">Use seu CPF ou usuário e senha para acessar os cursos.</p>

      {ativado && (
        <div className="alert alert-success">
          Conta ativada. Faça login com seu CPF (ou usuário) e a nova senha.
        </div>
      )}
      {sessaoExpirada && (
        <div className="alert alert-error">Sessão expirada. Faça login novamente.</div>
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
            placeholder="000.000.000-00 ou username"
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
            placeholder="••••••••"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="auth-footer">
        Primeiro acesso?{" "}
        <a href={internoUrl}>Ative com seu token-key</a>
      </p>
    </>
  );
}
