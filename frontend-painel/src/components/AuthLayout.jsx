import { Outlet } from "react-router-dom";
import ThemeToggle from "@shared/ui/ThemeToggle.jsx";
import Logo from "./Logo";

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <ThemeToggle float />
      <div className="auth-card">
        <Logo variant="auth" linkTo="/" />
        <Outlet />
      </div>
    </div>
  );
}
