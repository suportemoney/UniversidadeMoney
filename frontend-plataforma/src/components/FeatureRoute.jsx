import { Navigate, useOutletContext } from "react-router-dom";

export default function FeatureRoute({ feature, children }) {
  const { user } = useOutletContext() || {};

  if (!user) {
    return null;
  }

  if (user.pode_gestao || user.features?.[feature]) {
    return children;
  }

  return <Navigate to="/dashboard" replace />;
}
