import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoHomePage() {
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    gestaoApi.resumo().then(setResumo);
  }, []);

  if (!resumo) return <p>Carregando resumo...</p>;

  return (
    <div>
      <h1>Resumo da gestão</h1>
      <div className="gestao-cards">
        <div className="gestao-card">
          <strong>{resumo.cursos_publicados}</strong>
          <span>Cursos publicados</span>
        </div>
        <div className="gestao-card">
          <strong>{resumo.cursos_rascunho}</strong>
          <span>Rascunhos</span>
        </div>
        <div className="gestao-card">
          <strong>{resumo.trilhas}</strong>
          <span>Trilhas</span>
        </div>
      </div>
      <div className="gestao-actions-row">
        <Link to="/gestao/cursos/novo" className="btn btn-primary">Novo curso</Link>
        <Link to="/gestao/trilhas" className="btn btn-outline">Gerenciar trilhas</Link>
      </div>
    </div>
  );
}
