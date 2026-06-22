import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMe, logout } from "../services/api";

const ROTAS_SEM_PLANO = ["/dashboard/ativar-plano", "/dashboard/ajuda"];

function rotaPermitidaSemPlano(pathname) {
  return ROTAS_SEM_PLANO.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
}

export default function PlanoRoute({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => {
        logout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dash-page" style={{ padding: "2rem" }}>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const temAcesso = user.pode_gestao || user.tem_plano;
  if (!temAcesso && !rotaPermitidaSemPlano(location.pathname)) {
    return <Navigate to="/dashboard/ativar-plano" replace />;
  }

  return children;
}
