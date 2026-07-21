import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearTokens, getMe, isAuthenticated } from "../services/api";
import { rotaPermitida } from "../utils/niveisAcesso";

export default function GestaoRoute({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessaoInvalida, setSessaoInvalida] = useState(false);
  const [semAcesso, setSemAcesso] = useState(false);
  const [rotaNegada, setRotaNegada] = useState(false);
  const [precisaSenha, setPrecisaSenha] = useState(false);
  const [precisaMfa, setPrecisaMfa] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    getMe()
      .then((me) => {
        if (!me?.pode_gestao) {
          clearTokens();
          setSemAcesso(true);
          return;
        }
        if (me.precisa_redefinir_senha) {
          setPrecisaSenha(true);
          return;
        }
        if (me.precisa_mfa_painel && !me.mfa_ok) {
          setPrecisaMfa(true);
          return;
        }
        setUser(me);
        if (!rotaPermitida(location.pathname, me)) {
          setRotaNegada(true);
        } else {
          setRotaNegada(false);
        }
      })
      .catch(() => {
        clearTokens();
        setSessaoInvalida(true);
      })
      .finally(() => setLoading(false));
  }, [location.pathname]);

  if (loading) return <div className="gestao-loading">Carregando...</div>;

  if (!isAuthenticated() || sessaoInvalida || semAcesso) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          sessaoExpirada: sessaoInvalida,
          semAcessoPainel: semAcesso,
        }}
        replace
      />
    );
  }

  if (precisaSenha) {
    return <Navigate to="/redefinir-senha" replace />;
  }

  if (precisaMfa) {
    return <Navigate to="/mfa" replace />;
  }

  if (rotaNegada) {
    const dest = user?.escopo_cursos_apenas ? "/gestao/cursos" : "/gestao";
    return <Navigate to={dest} replace />;
  }

  return children;
}
