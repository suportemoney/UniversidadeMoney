import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getMe, isAuthenticated, redefinirSenhaObrigatoria } from "../services/api";
import { formatarCpf } from "../utils/cpf";
import { destinoAposAuthPainel } from "../utils/posLogin";

/** Troca obrigatória de senha (após reset admin ou convite). */
export default function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [temCpf, setTemCpf] = useState(true);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    getMe()
      .then((me) => {
        if (me?.precisa_mfa_painel && !me?.mfa_ok) {
          navigate("/mfa", { replace: true });
          return;
        }
        setTemCpf(Boolean(me?.cpf));
      })
      .catch(() => {});
  }, [navigate]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    if (novaSenha !== confirma) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await redefinirSenhaObrigatoria(cpf, novaSenha);
      const me = await getMe();
      navigate(destinoAposAuthPainel(me), { replace: true });
    } catch (err) {
      setErro(err.message || "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Redefinir senha</h2>
      <p className="auth-subtitle">
        {temCpf
          ? "Confirme seu CPF e escolha uma nova senha para continuar."
          : "Escolha uma nova senha para continuar."}
      </p>
      {erro && <div className="alert alert-error">{erro}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        {temCpf && (
          <label>
            CPF
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              autoComplete="off"
            />
          </label>
        )}
        <label>
          Nova senha
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirmar senha
          <input
            type="password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </>
  );
}
