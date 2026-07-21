import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import GestaoLayout from "./components/GestaoLayout";
import GestaoRoute from "./components/GestaoRoute";
import LoginPage from "./pages/LoginPage";
import MfaPage from "./pages/MfaPage";
import RedefinirSenhaPage from "./pages/RedefinirSenhaPage";
import GestaoAoVivoPage from "./pages/gestao/GestaoAoVivoPage";
import GestaoApiPage from "./pages/gestao/GestaoApiPage";
import GestaoBibliotecaPage from "./pages/gestao/GestaoBibliotecaPage";
import GestaoComunicadosPage from "./pages/gestao/GestaoComunicadosPage";
import GestaoConvitesPage from "./pages/gestao/GestaoConvitesPage";
import GestaoSetoresPage from "./pages/gestao/GestaoSetoresPage";
import GestaoTagsPage from "./pages/gestao/GestaoTagsPage";
import GestaoCursosPage from "./pages/gestao/GestaoCursosPage";
import GestaoEquipePage from "./pages/gestao/GestaoEquipePage";
import GestaoHomePage from "./pages/gestao/GestaoHomePage";
import GestaoTrilhaEditorPage from "./pages/gestao/GestaoTrilhaEditorPage";
import GestaoTrilhasPage from "./pages/gestao/GestaoTrilhasPage";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/gestao" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
          <Route path="/mfa" element={<MfaPage />} />
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
          <Route path="api" element={<GestaoApiPage />} />
          <Route path="equipe" element={<GestaoEquipePage />} />
          <Route path="cursos" element={<GestaoCursosPage />} />
          <Route path="setores" element={<GestaoSetoresPage />} />
          <Route path="trilhas" element={<GestaoTrilhasPage />} />
          <Route path="trilhas/:id" element={<GestaoTrilhaEditorPage />} />
          <Route path="comunicados" element={<GestaoComunicadosPage />} />
          <Route path="ao-vivo" element={<GestaoAoVivoPage />} />
          <Route path="biblioteca" element={<GestaoBibliotecaPage />} />
          <Route path="tags" element={<GestaoTagsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/gestao" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
