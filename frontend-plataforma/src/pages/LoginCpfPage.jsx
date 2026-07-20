import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getMe, loginComCpf } from "../services/api";
import { formatarCpf } from "../utils/cpf";

export default function LoginCpfPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const ativado = params.get("ativado") === "1";
  const sessaoExpirada = location.state?.sessaoExpirada;

  const [cpf, setCpf] = useState("");
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
      await loginComCpf(cpf, password);
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
      <h2>Entrar na plataforma</h2>
      <p className="auth-subtitle">Use seu CPF e senha para acessar os cursos.</p>

      {ativado && (
        <div className="alert alert-success">
          Conta ativada. Faça login com seu CPF e a nova senha.
        </div>
      )}
      {sessaoExpirada && (
        <div className="alert alert-error">Sessão expirada. Faça login novamente.</div>
      )}
      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          CPF
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            required
            inputMode="numeric"
            placeholder="000.000.000-00"
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
