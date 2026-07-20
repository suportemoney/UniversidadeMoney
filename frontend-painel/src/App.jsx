import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import GestaoLayout from "./components/GestaoLayout";
import GestaoRoute from "./components/GestaoRoute";
import LoginPage from "./pages/LoginPage";
import GestaoAoVivoPage from "./pages/gestao/GestaoAoVivoPage";
import GestaoBibliotecaPage from "./pages/gestao/GestaoBibliotecaPage";
import GestaoComunicadosPage from "./pages/gestao/GestaoComunicadosPage";
import GestaoConvitesPage from "./pages/gestao/GestaoConvitesPage";
import GestaoPlanosPage from "./pages/gestao/GestaoPlanosPage";
import GestaoSetoresPage from "./pages/gestao/GestaoSetoresPage";
import GestaoTagsPage from "./pages/gestao/GestaoTagsPage";
import GestaoTokensPage from "./pages/gestao/GestaoTokensPage";
import GestaoCursoEditorPage from "./pages/gestao/GestaoCursoEditorPage";
import GestaoCursosPage from "./pages/gestao/GestaoCursosPage";
import GestaoEquipePage from "./pages/gestao/GestaoEquipePage";
import GestaoHomePage from "./pages/gestao/GestaoHomePage";
import GestaoTrilhaEditorPage from "./pages/gestao/GestaoTrilhaEditorPage";
import GestaoTrilhasPage from "./pages/gestao/GestaoTrilhasPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/gestao" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="convites" element={<GestaoConvitesPage />} />
          <Route path="equipe" element={<GestaoEquipePage />} />
          <Route path="cursos" element={<GestaoCursosPage />} />
          <Route path="cursos/:id" element={<GestaoCursoEditorPage />} />
          <Route path="setores" element={<GestaoSetoresPage />} />
          <Route path="trilhas" element={<GestaoTrilhasPage />} />
          <Route path="trilhas/:id" element={<GestaoTrilhaEditorPage />} />
          <Route path="comunicados" element={<GestaoComunicadosPage />} />
          <Route path="ao-vivo" element={<GestaoAoVivoPage />} />
          <Route path="biblioteca" element={<GestaoBibliotecaPage />} />
          <Route path="planos" element={<GestaoPlanosPage />} />
          <Route path="tags" element={<GestaoTagsPage />} />
          <Route path="tokens" element={<GestaoTokensPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/gestao" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
