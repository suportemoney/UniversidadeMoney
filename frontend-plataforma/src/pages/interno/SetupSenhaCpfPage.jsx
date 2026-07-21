import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ativarTokenAcesso } from "../../services/api";
import { formatarCpf } from "../../utils/cpf";

const PLATAFORMA_URL =
  import.meta.env.VITE_PLATAFORMA_URL || "http://localhost:5173/login";

export default function SetupSenhaCpfPage() {
  const location = useLocation();
  const chave = location.state?.chave;
  const username = location.state?.username;
  const senhaPadrao = location.state?.senhaPadrao || "123456";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  if (!chave || !username) {
    return <Navigate to="/" replace />;
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
      await ativarTokenAcesso(chave, novaSenha, cpf);
      window.location.href = `${PLATAFORMA_URL}?ativado=1`;
    } catch (err) {
      setErro(err.message || "Não foi possível ativar o acesso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Ativar conta</h2>
      <p className="auth-subtitle">
        Conta vinculada: <strong>{username}</strong>
      </p>
      <div className="alert alert-success">
        Senha padrão temporária: <strong>{senhaPadrao}</strong>. Redefina a senha e
        confirme o CPF cadastrado no convite para concluir.
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
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
        <label>
          Confirme seu CPF
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
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Ativando..." : "Ativar e ir para a plataforma"}
        </button>
      </form>
    </>
  );
}
