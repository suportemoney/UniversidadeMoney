import { Outlet } from "react-router-dom";
import Logo from "./Logo";

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <Logo variant="auth" linkTo="/" />
        <Outlet />
      </div>
    </div>
  );
}
