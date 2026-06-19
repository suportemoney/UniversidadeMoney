import { Link, Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          UniversidadeMoney
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
