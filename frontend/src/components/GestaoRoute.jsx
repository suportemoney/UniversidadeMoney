import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearTokens, getMe, isAuthenticated } from "../services/api";
import { rotaPermitida } from "../utils/niveisAcesso";

export default function GestaoRoute({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessaoInvalida, setSessaoInvalida] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        clearTokens();
        setSessaoInvalida(true);
      })
      .finally(() => setLoading(false));
  }, [location.pathname]);

  if (loading) return <div className="gestao-loading">Carregando...</div>;
  if (!isAuthenticated() || sessaoInvalida) {
    return <Navigate to="/login" state={{ from: location, sessaoExpirada: sessaoInvalida }} replace />;
  }
  if (!user?.pode_gestao) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!rotaPermitida(location.pathname, user)) {
    const dest = user?.escopo_cursos_apenas ? "/gestao/cursos" : "/gestao";
    return <Navigate to={dest} replace />;
  }

  return children;
}
