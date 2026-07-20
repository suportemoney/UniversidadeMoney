import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import PageHeader from "../components/dashboard/PageHeader";
import { getMe, resgatarToken } from "../services/api";

export default function AtivarPlanoPage() {
  const navigate = useNavigate();
  const { user: userCtx } = useOutletContext() || {};
  const [chave, setChave] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    if (userCtx?.tem_plano || userCtx?.pode_gestao) {
      navigate("/dashboard", { replace: true });
      return;
    }
    getMe().then((me) => {
      if (me.tem_plano || me.pode_gestao) {
        navigate("/dashboard", { replace: true });
      }
    }).catch(() => {});
  }, [userCtx, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    const valor = chave.trim().toUpperCase();
    if (!valor) {
      setErro("Informe a chave do seu plano.");
      return;
    }
    setLoading(true);
    try {
      const res = await resgatarToken(valor);
      setSucesso(res.message || "Plano ativado com sucesso!");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
    } catch (err) {
      setErro(err.message || "Não foi possível ativar o plano.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-page">
      <PageHeader
        icon="🔑"
        titulo="Ativar plano"
        subtitulo="Cole a chave de acesso que você recebeu para liberar o painel do aluno."
      />

      {sucesso && <div className="alert alert-success">{sucesso}</div>}
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="dash-card" style={{ maxWidth: 480 }}>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Chave do plano
            <input
              type="text"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="UM-XXXX-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Ativando..." : "Ativar plano"}
          </button>
        </form>
        <p className="auth-footer" style={{ marginTop: "1rem" }}>
          Não tem uma chave?{" "}
          <Link to="/dashboard/ajuda">Fale com o suporte</Link>
        </p>
      </div>
    </div>
  );
}
