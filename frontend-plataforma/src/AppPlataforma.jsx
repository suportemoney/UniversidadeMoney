import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import DashboardLayout from "./components/DashboardLayout";
import FeatureRoute from "./components/FeatureRoute";
import PlanoRoute from "./components/PlanoRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AjudaPage from "./pages/AjudaPage";
import AoVivoPage from "./pages/AoVivoPage";
import AtivarPlanoPage from "./pages/AtivarPlanoPage";
import BibliotecaPage from "./pages/BibliotecaPage";
import BuscaPage from "./pages/BuscaPage";
import CertificadosPage from "./pages/CertificadosPage";
import ComunicadosPage from "./pages/ComunicadosPage";
import CursoDetalhePage from "./pages/CursoDetalhePage";
import CursoPlayerPage from "./pages/CursoPlayerPage";
import DashboardPage from "./pages/DashboardPage";
import ExplorarCursosPage from "./pages/ExplorarCursosPage";
import LoginCpfPage from "./pages/LoginCpfPage";
import MeusCursosPage from "./pages/MeusCursosPage";
import ProgressoPage from "./pages/ProgressoPage";
import TrilhaDetalhePage from "./pages/TrilhaDetalhePage";
import TrilhasPage from "./pages/TrilhasPage";
import "./App.css";

/** Rotas da plataforma (cursos + login CPF). */
export default function AppPlataforma() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginCpfPage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PlanoRoute>
                <DashboardLayout />
              </PlanoRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="ativar-plano" element={<AtivarPlanoPage />} />
          <Route path="meus-cursos" element={<FeatureRoute feature="acesso_cursos"><MeusCursosPage /></FeatureRoute>} />
          <Route path="explorar" element={<FeatureRoute feature="acesso_cursos"><ExplorarCursosPage /></FeatureRoute>} />
          <Route path="busca" element={<FeatureRoute feature="acesso_cursos"><BuscaPage /></FeatureRoute>} />
          <Route path="curso/:id" element={<FeatureRoute feature="acesso_cursos"><CursoDetalhePage /></FeatureRoute>} />
          <Route path="cursos/:cursoId" element={<FeatureRoute feature="acesso_cursos"><CursoPlayerPage /></FeatureRoute>} />
          <Route path="trilhas" element={<FeatureRoute feature="acesso_trilhas"><TrilhasPage /></FeatureRoute>} />
          <Route path="trilhas/:id" element={<FeatureRoute feature="acesso_trilhas"><TrilhaDetalhePage /></FeatureRoute>} />
          <Route path="ao-vivo" element={<FeatureRoute feature="acesso_ao_vivo"><AoVivoPage /></FeatureRoute>} />
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
