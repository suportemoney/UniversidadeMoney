import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import SetupSenhaCpfPage from "./pages/interno/SetupSenhaCpfPage";
import TokenKeyPage from "./pages/interno/TokenKeyPage";
import "./App.css";

/** Basename do Vite (produção em /interno/ ; local sem prefixo). */
function routerBasename() {
  const raw = import.meta.env.BASE_URL || "/";
  if (raw === "/") return undefined;
  return raw.replace(/\/$/, "");
}

/** Portal interno: apenas token-key e setup inicial. */
export default function AppInterno() {
  return (
    <BrowserRouter
      basename={routerBasename()}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<TokenKeyPage />} />
          <Route path="/setup" element={<SetupSenhaCpfPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
