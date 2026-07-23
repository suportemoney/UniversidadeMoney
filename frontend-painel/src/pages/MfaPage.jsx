import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  getMe,
  isAuthenticated,
  mfaConfirmar,
  mfaEnroll,
  mfaVerificar,
  mfaVerificarCpf,
} from "../services/api";
import { formatarCpf } from "../utils/cpf";

/**
 * 2FA do painel (gestor/admin): CPF → QR (1ª vez) ou só código TOTP.
 * Opção “Confiar neste dispositivo” evita pedir o código nos próximos logins.
 */
export default function MfaPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState("cpf");
  const [cpf, setCpf] = useState("");
  const [codigo, setCodigo] = useState("");
  const [totpConfirmado, setTotpConfirmado] = useState(false);
  const [qrBase64, setQrBase64] = useState("");
  const [confiarDispositivo, setConfiarDispositivo] = useState(true);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [precisaCadastrarCpf, setPrecisaCadastrarCpf] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) return;
    getMe()
      .then((me) => {
        if (!me.precisa_mfa_painel || me.mfa_ok) {
          navigate("/gestao", { replace: true });
          return;
        }
        setPrecisaCadastrarCpf(!me.cpf);
      })
      .catch(() => {});
  }, [navigate]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const aposSucesso = async () => {
    const me = await getMe();
    if (me.mfa_ok) {
      navigate("/gestao", { replace: true });
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
        // Preferir QR já retornado na verificação (mesmo request)
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

  const enviarCodigo = async (e) => {
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

  return (
    <>
      <h2>Autenticação em duas etapas</h2>
      <p className="auth-subtitle">
        {etapa === "cpf"
          ? (precisaCadastrarCpf
            ? "Esta conta ainda não tem CPF. Informe o seu para vincular e continuar."
            : "Confirme seu CPF para liberar o autenticador.")
          : totpConfirmado
            ? "Digite o código gerado no app (Google Authenticator ou similar)."
            : "Escaneie o QR Code no app e digite o código gerado."}
      </p>

      {erro && <div className="alert alert-error">{erro}</div>}

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
        </form>
      )}

      {etapa === "totp" && (
        <form onSubmit={enviarCodigo} className="auth-form">
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
        </form>
      )}
    </>
  );
}
