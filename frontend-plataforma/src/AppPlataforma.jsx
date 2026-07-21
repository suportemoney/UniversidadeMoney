import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AjudaPage from "./pages/AjudaPage";
import AoVivoPage from "./pages/AoVivoPage";
import BibliotecaPage from "./pages/BibliotecaPage";
import BuscaPage from "./pages/BuscaPage";
import CertificadosPage from "./pages/CertificadosPage";
import ComunicadosPage from "./pages/ComunicadosPage";
import CursoDetalhePage from "./pages/CursoDetalhePage";
import CursoPlayerPage from "./pages/CursoPlayerPage";
import DashboardPage from "./pages/DashboardPage";
import ExplorarCursosPage from "./pages/ExplorarCursosPage";
import LoginCpfPage from "./pages/LoginCpfPage";
import RedefinirSenhaPage from "./pages/RedefinirSenhaPage";
import MeusCursosPage from "./pages/MeusCursosPage";
import ProgressoPage from "./pages/ProgressoPage";
import TrilhaDetalhePage from "./pages/TrilhaDetalhePage";
import TrilhasPage from "./pages/TrilhasPage";
import "./App.css";

/** Rotas da plataforma interna (cursos + login CPF) — sem planos. */
export default function AppPlataforma() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginCpfPage />} />
          <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="meus-cursos" element={<MeusCursosPage />} />
          <Route path="explorar" element={<ExplorarCursosPage />} />
          <Route path="busca" element={<BuscaPage />} />
          <Route path="curso/:id" element={<CursoDetalhePage />} />
          <Route path="cursos/:cursoId" element={<CursoPlayerPage />} />
          <Route path="trilhas" element={<TrilhasPage />} />
          <Route path="trilhas/:id" element={<TrilhaDetalhePage />} />
          <Route path="ao-vivo" element={<AoVivoPage />} />
          <Route path="certificados" element={<CertificadosPage />} />
          <Route path="biblioteca" element={<BibliotecaPage />} />
          <Route path="comunicados" element={<ComunicadosPage />} />
          <Route path="progresso" element={<ProgressoPage />} />
          <Route path="ajuda" element={<AjudaPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
