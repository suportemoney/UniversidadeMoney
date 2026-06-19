import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import DashboardLayout from "./components/DashboardLayout";
import GestaoLayout from "./components/GestaoLayout";
import GestaoRoute from "./components/GestaoRoute";
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
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MeusCursosPage from "./pages/MeusCursosPage";
import ProgressoPage from "./pages/ProgressoPage";
import RankingPage from "./pages/RankingPage";
import RegisterPage from "./pages/RegisterPage";
import TrilhaDetalhePage from "./pages/TrilhaDetalhePage";
import TrilhasPage from "./pages/TrilhasPage";
import GestaoAoVivoPage from "./pages/gestao/GestaoAoVivoPage";
import GestaoBibliotecaPage from "./pages/gestao/GestaoBibliotecaPage";
import GestaoComunicadosPage from "./pages/gestao/GestaoComunicadosPage";
import GestaoCursoEditorPage from "./pages/gestao/GestaoCursoEditorPage";
import GestaoCursoNovoPage from "./pages/gestao/GestaoCursoNovoPage";
import GestaoCursosPage from "./pages/gestao/GestaoCursosPage";
import GestaoEquipePage from "./pages/gestao/GestaoEquipePage";
import GestaoHomePage from "./pages/gestao/GestaoHomePage";
import GestaoTrilhaEditorPage from "./pages/gestao/GestaoTrilhaEditorPage";
import GestaoTrilhasPage from "./pages/gestao/GestaoTrilhasPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
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
          <Route path="ranking" element={<RankingPage />} />
          <Route path="comunicados" element={<ComunicadosPage />} />
          <Route path="progresso" element={<ProgressoPage />} />
          <Route path="ajuda" element={<AjudaPage />} />
        </Route>

        <Route
          path="/gestao"
          element={
            <GestaoRoute>
              <GestaoLayout />
            </GestaoRoute>
          }
        >
          <Route index element={<GestaoHomePage />} />
          <Route path="equipe" element={<GestaoEquipePage />} />
          <Route path="cursos" element={<GestaoCursosPage />} />
          <Route path="cursos/novo" element={<GestaoCursoNovoPage />} />
          <Route path="cursos/:id" element={<GestaoCursoEditorPage />} />
          <Route path="trilhas" element={<GestaoTrilhasPage />} />
          <Route path="trilhas/:id" element={<GestaoTrilhaEditorPage />} />
          <Route path="comunicados" element={<GestaoComunicadosPage />} />
          <Route path="ao-vivo" element={<GestaoAoVivoPage />} />
          <Route path="biblioteca" element={<GestaoBibliotecaPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
