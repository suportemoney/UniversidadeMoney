import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import "../styles/gestao.css";

export default function MeusCursosPage() {
  const [cursos, setCursos] = useState([]);

  useEffect(() => {
    apiFetch("/meus-cursos/").then(setCursos);
  }, []);

  return (
    <div className="dash-placeholder">
      <h1>Meus cursos</h1>
      {cursos.length === 0 && (
        <p className="gestao-muted">Você ainda não está matriculado em nenhum curso.</p>
      )}
      <div className="gestao-cards">
        {cursos.map((c) => (
          <Link key={c.curso_id} to={`/dashboard/cursos/${c.curso_id}`} className="gestao-card gestao-card-link">
            <strong>{c.titulo}</strong>
            <span>{c.progresso}% concluído</span>
            {c.concluido && <span className="gestao-badge">Certificado</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
