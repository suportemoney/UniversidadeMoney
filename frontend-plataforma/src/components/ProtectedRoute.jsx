import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe, isAuthenticated } from "../services/api";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [precisaSenha, setPrecisaSenha] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    getMe()
      .then((me) => {
        if (me?.precisa_redefinir_senha) setPrecisaSenha(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location.pathname]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (loading) return null;

  if (precisaSenha && location.pathname !== "/redefinir-senha") {
    return <Navigate to="/redefinir-senha" replace />;
  }

  return children;
}
