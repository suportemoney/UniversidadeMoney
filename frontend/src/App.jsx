import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import DashboardLayout from "./components/DashboardLayout";
import FeatureRoute from "./components/FeatureRoute";
import GestaoLayout from "./components/GestaoLayout";
import GestaoRoute from "./components/GestaoRoute";
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
import GestaoPlanosPage from "./pages/gestao/GestaoPlanosPage";
import GestaoTagsPage from "./pages/gestao/GestaoTagsPage";
import GestaoTokensPage from "./pages/gestao/GestaoTokensPage";
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
          <Route path="certificados" element={<FeatureRoute feature="acesso_certificados"><CertificadosPage /></FeatureRoute>} />
          <Route path="biblioteca" element={<FeatureRoute feature="acesso_biblioteca"><BibliotecaPage /></FeatureRoute>} />
          <Route path="ranking" element={<FeatureRoute feature="acesso_ranking"><RankingPage /></FeatureRoute>} />
          <Route path="comunicados" element={<FeatureRoute feature="acesso_comunicados"><ComunicadosPage /></FeatureRoute>} />
          <Route path="progresso" element={<FeatureRoute feature="acesso_progresso"><ProgressoPage /></FeatureRoute>} />
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
          <Route path="planos" element={<GestaoPlanosPage />} />
          <Route path="tags" element={<GestaoTagsPage />} />
          <Route path="tokens" element={<GestaoTokensPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
