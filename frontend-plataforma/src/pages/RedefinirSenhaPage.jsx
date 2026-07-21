import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isAuthenticated, redefinirSenhaObrigatoria } from "../services/api";
import { formatarCpf } from "../utils/cpf";

export default function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

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
      navigate("/dashboard", { replace: true });
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
        Confirme seu CPF e escolha uma nova senha para continuar na plataforma.
      </p>
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
            autoComplete="off"
          />
        </label>
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
