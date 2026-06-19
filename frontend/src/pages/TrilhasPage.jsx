import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrilhas } from "../services/api";

export default function TrilhasPage() {
  const [trilhas, setTrilhas] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getTrilhas().then(setTrilhas).catch((e) => setErro(e.message));
  }, []);

  if (erro) return <div className="alert alert-error">{erro}</div>;

  return (
    <div>
      <h1>Trilhas de aprendizado</h1>
      <p className="dash-muted">Percursos organizados por setor e carreira.</p>
      <div className="dash-scroll-row">
        {trilhas.map((t) => (
          <Link key={t.id} to={`/dashboard/trilhas/${t.id}`} className="dash-trilha-card dash-trilha-card--link">
            <strong>{t.titulo}</strong>
            {t.setor && <small>{t.setor}</small>}
            <small>{t.total_cursos} cursos</small>
            <div className="dash-progress">
              <div className="dash-progress-bar" style={{ width: `${t.progresso}%` }} />
            </div>
            <span className="dash-progress-text">{t.progresso}% concluído</span>
          </Link>
        ))}
        {trilhas.length === 0 && <p>Nenhuma trilha disponível.</p>}
      </div>
    </div>
  );
}
