import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe, isAuthenticated } from "../services/api";

export default function GestaoRoute({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    getMe()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="gestao-loading">Carregando...</div>;
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!user?.pode_gestao) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
