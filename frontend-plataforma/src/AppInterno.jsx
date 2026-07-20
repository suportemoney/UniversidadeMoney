import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import SetupSenhaCpfPage from "./pages/interno/SetupSenhaCpfPage";
import TokenKeyPage from "./pages/interno/TokenKeyPage";
import "./App.css";

/** Portal interno: apenas token-key e setup inicial. */
export default function AppInterno() {
  return (
    <BrowserRouter>
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
