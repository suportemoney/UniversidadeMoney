import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validarTokenAcesso } from "../../services/api";

export default function TokenKeyPage() {
  const navigate = useNavigate();
  const [chave, setChave] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const data = await validarTokenAcesso(chave);
      navigate("/setup", {
        state: {
          chave: chave.trim().toUpperCase(),
          username: data.username,
          senhaPadrao: data.senha_padrao || "123456",
        },
      });
    } catch (err) {
      setErro(err.message || "Token inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Acesso interno</h2>
      <p className="auth-subtitle">
        Informe o token-key gerado no painel para ativar sua conta de colaborador.
      </p>

      {erro && <div className="alert alert-error">{erro}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Token-key
          <input
            type="text"
            value={chave}
            onChange={(e) => setChave(e.target.value.toUpperCase())}
            required
            autoComplete="off"
            placeholder="UM-ACESSO-XXXX-XXXX"
            spellCheck={false}
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Validando..." : "Continuar"}
        </button>
      </form>
    </>
  );
}
