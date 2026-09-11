import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { confirmarRecuperarSenha, solicitarRecuperarSenha } from "../services/api";

/** Esqueci a senha no painel: código por e-mail. */
export default function RecuperarSenhaPage() {
  const navigate = useNavigate();
  const [passo, setPasso] = useState(1);
  const [identificador, setIdentificador] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [aviso, setAviso] = useState("");
  const [emailMascarado, setEmailMascarado] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const pedirCodigo = async (e) => {
    e.preventDefault();
    setErro("");
    setAviso("");
    setLoading(true);
    try {
      const data = await solicitarRecuperarSenha(identificador);
      const mascarado = data.email_mascarado || "";
      setEmailMascarado(mascarado);
      setAviso(
        mascarado
          ? `Enviamos um código para ${mascarado}.`
          : (data.message || "Se houver uma conta com e-mail cadastrado, enviaremos um código.")
      );
      setPasso(2);
    } catch (err) {
      setErro(err.message || "Não foi possível enviar o código.");
    } finally {
      setLoading(false);
    }
  };

  const confirmar = async (e) => {
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
      await confirmarRecuperarSenha(identificador, codigo, novaSenha);
      navigate("/login", { replace: true });
    } catch (err) {
      setErro(err.message || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Esqueci a senha</h2>
      <p className="auth-subtitle">
        {passo === 1
          ? "Informe CPF, usuário ou e-mail. Enviaremos um código se houver conta com e-mail."
          : (emailMascarado
            ? `Digite o código enviado para ${emailMascarado} e a nova senha.`
            : "Digite o código recebido e a nova senha.")}
      </p>
      {aviso && <div className="alert alert-success">{aviso}</div>}
      {erro && <div className="alert alert-error">{erro}</div>}

      {passo === 1 ? (
        <form onSubmit={pedirCodigo} className="auth-form">
          <label>
            CPF, usuário ou e-mail
            <input
              type="text"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              autoComplete="username"
              placeholder="000.000.000-00 ou e-mail"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmar} className="auth-form">
          <label>
            Código
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
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
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>
      )}

      <p className="auth-footer">
        <Link to="/login">Voltar ao login</Link>
      </p>
    </>
  );
}
