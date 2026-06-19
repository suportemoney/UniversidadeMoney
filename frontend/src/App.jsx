import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import DashboardLayout from "./components/DashboardLayout";
import GestaoLayout from "./components/GestaoLayout";
import GestaoRoute from "./components/GestaoRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import CursoPlayerPage from "./pages/CursoPlayerPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MeusCursosPage from "./pages/MeusCursosPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import RegisterPage from "./pages/RegisterPage";
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
          <Route path="cursos/:cursoId" element={<CursoPlayerPage />} />
          <Route
            path="trilhas"
            element={
              <PlaceholderPage
                titulo="Trilhas"
                descricao="Trilhas de aprendizado organizadas por setor e carreira."
              />
            }
          />
          <Route
            path="ao-vivo"
            element={
              <PlaceholderPage
                titulo="Treinamentos ao vivo"
                descricao="Agenda de workshops e treinamentos presenciais online."
              />
            }
          />
          <Route
            path="certificados"
            element={
              <PlaceholderPage
                titulo="Certificados"
                descricao="Seus certificados emitidos ao concluir os cursos."
              />
            }
          />
          <Route
            path="biblioteca"
            element={
              <PlaceholderPage
                titulo="Biblioteca"
                descricao="Materiais de apoio, PDFs e recursos complementares."
              />
            }
          />
          <Route
            path="ranking"
            element={
              <PlaceholderPage
                titulo="Ranking"
                descricao="Classificação de evolução entre colaboradores."
              />
            }
          />
          <Route
            path="comunicados"
            element={
              <PlaceholderPage
                titulo="Comunicados"
                descricao="Notícias e avisos internos da Money Promotora."
              />
            }
          />
          <Route
            path="progresso"
            element={
              <PlaceholderPage
                titulo="Meu progresso"
                descricao="Visão detalhada das suas horas e metas de treinamento."
              />
            }
          />
          <Route
            path="ajuda"
            element={
              <PlaceholderPage
                titulo="Ajuda"
                descricao="Suporte e perguntas frequentes sobre a plataforma."
              />
            }
          />
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
