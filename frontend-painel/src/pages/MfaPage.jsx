import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  getMe,
  isAuthenticated,
  mfaConfirmar,
  mfaEmailEnviar,
  mfaEmailVerificar,
  mfaEnroll,
  mfaVerificar,
  mfaVerificarCpf,
} from "../services/api";
import { formatarCpf } from "../utils/cpf";
import { destinoAposAuthPainel } from "../utils/posLogin";

/**
 * MFA do painel: escolher app 2FA ou código no e-mail.
 * Contas com CPF confirmam o documento antes do autenticador.
 * Superuser (admin) não usa CPF.
 */
export default function MfaPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState("escolha");
  const [cpf, setCpf] = useState("");
  const [codigo, setCodigo] = useState("");
  const [totpConfirmado, setTotpConfirmado] = useState(false);
  const [temCpf, setTemCpf] = useState(true);
  const [qrBase64, setQrBase64] = useState("");
  const [emailMascarado, setEmailMascarado] = useState("");
  const [confiarDispositivo, setConfiarDispositivo] = useState(true);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    getMe()
      .then((me) => {
        if (!me.precisa_mfa_painel || me.mfa_ok) {
          navigate(destinoAposAuthPainel(me), { replace: true });
          return;
        }
        setTemCpf(Boolean(me.cpf));
        setTotpConfirmado(Boolean(me.totp_confirmado));
      })
      .catch(() => {});
  }, [navigate]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const aposSucesso = async () => {
    const me = await getMe();
    navigate(destinoAposAuthPainel(me), { replace: true });
  };

  const voltarEscolha = () => {
    setErro("");
    setCodigo("");
    setEtapa("escolha");
  };

  const iniciarTotp = async () => {
    setErro("");
    setCodigo("");
    if (temCpf) {
      setEtapa("cpf");
      return;
    }
    setLoading(true);
    try {
      if (!totpConfirmado) {
        const enroll = await mfaEnroll();
        setQrBase64(enroll.qr_base64 || "");
      }
      setEtapa("totp");
    } catch (err) {
      setErro(err.message || "Não foi possível iniciar o autenticador.");
    } finally {
      setLoading(false);
    }
  };

  const iniciarEmail = async () => {
    setErro("");
    setCodigo("");
    setLoading(true);
    try {
      const data = await mfaEmailEnviar();
      setEmailMascarado(data.email_mascarado || "");
      setEtapa("email");
    } catch (err) {
      setErro(err.message || "Não foi possível enviar o código por e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const confirmarCpf = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const data = await mfaVerificarCpf(cpf);
      setTotpConfirmado(!!data.totp_confirmado);
      if (!data.totp_confirmado) {
        if (data.qr_base64) {
          setQrBase64(data.qr_base64);
        } else {
          const enroll = await mfaEnroll();
          setQrBase64(enroll.qr_base64 || "");
        }
      }
      setEtapa("totp");
    } catch (err) {
      setErro(err.message || "CPF inválido.");
    } finally {
      setLoading(false);
    }
  };

  const enviarCodigoTotp = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      if (totpConfirmado) {
        await mfaVerificar(codigo, confiarDispositivo);
      } else {
        await mfaConfirmar(codigo, confiarDispositivo);
      }
      await aposSucesso();
    } catch (err) {
      setErro(err.message || "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  const enviarCodigoEmail = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await mfaEmailVerificar(codigo, confiarDispositivo);
      await aposSucesso();
    } catch (err) {
      setErro(err.message || "Código inválido.");
    } finally {
      setLoading(false);
    }
  };

  const subtitulo = {
    escolha: "Escolha como confirmar seu login.",
    cpf: "Confirme seu CPF para liberar o autenticador.",
    totp: totpConfirmado
      ? "Digite o código gerado no app (Google Authenticator ou similar)."
      : "Escaneie o QR Code no app e digite o código gerado.",
    email: emailMascarado
      ? `Digite o código enviado para ${emailMascarado}.`
      : "Digite o código recebido no e-mail.",
  }[etapa];

  return (
    <>
      <h2>Autenticação em duas etapas</h2>
      <p className="auth-subtitle">{subtitulo}</p>

      {erro && <div className="alert alert-error">{erro}</div>}

      {etapa === "escolha" && (
        <div className="mfa-escolha">
          <button type="button" className="btn btn-primary btn-block" onClick={iniciarTotp} disabled={loading}>
            {loading ? "Abrindo..." : "App autenticador (2FA)"}
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={iniciarEmail} disabled={loading}>
            Código no e-mail
          </button>
        </div>
      )}

      {etapa === "cpf" && (
        <form onSubmit={confirmarCpf} className="auth-form">
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
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Verificando..." : "Continuar"}
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={voltarEscolha}>
            Outra forma
          </button>
        </form>
      )}

      {etapa === "totp" && (
        <form onSubmit={enviarCodigoTotp} className="auth-form">
          {!totpConfirmado && qrBase64 && (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <img
                src={`data:image/png;base64,${qrBase64}`}
                alt="QR Code do autenticador"
                width={200}
                height={200}
              />
              <p className="auth-subtitle" style={{ marginTop: "0.5rem" }}>
                Abra o Authenticator, adicione a conta pelo QR e use o código de 6 dígitos.
              </p>
            </div>
          )}
          <label>
            Código do app
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              placeholder="000000"
              autoComplete="one-time-code"
            />
          </label>
          <label className="gestao-checkbox" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <input
              type="checkbox"
              checked={confiarDispositivo}
              onChange={(e) => setConfiarDispositivo(e.target.checked)}
            />
            <span>Confiar neste dispositivo por 30 dias (não pedir o código a cada login)</span>
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Validando..." : "Validar e entrar"}
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={voltarEscolha}>
            Outra forma
          </button>
        </form>
      )}

      {etapa === "email" && (
        <form onSubmit={enviarCodigoEmail} className="auth-form">
          {emailMascarado && (
            <div className="alert alert-success">Enviamos um código para {emailMascarado}.</div>
          )}
          <label>
            Código do e-mail
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              placeholder="000000"
              autoComplete="one-time-code"
            />
          </label>
          <label className="gestao-checkbox" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <input
              type="checkbox"
              checked={confiarDispositivo}
              onChange={(e) => setConfiarDispositivo(e.target.checked)}
            />
            <span>Confiar neste dispositivo por 30 dias (não pedir o código a cada login)</span>
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Validando..." : "Validar e entrar"}
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={iniciarEmail} disabled={loading}>
            Reenviar código
          </button>
          <button type="button" className="btn btn-outline btn-block" onClick={voltarEscolha}>
            Outra forma
          </button>
        </form>
      )}
    </>
  );
}
