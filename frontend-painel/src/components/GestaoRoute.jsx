import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearTokens, getMe, isAuthenticated } from "../services/api";

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
  }, []);

  if (loading) return <div className="gestao-loading">Carregando...</div>;
  if (!isAuthenticated() || sessaoInvalida) {
    return <Navigate to="/login" state={{ from: location, sessaoExpirada: sessaoInvalida }} replace />;
  }
  if (!user?.pode_gestao) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
