import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTrilha, matricularCurso } from "../services/api";

export default function TrilhaDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trilha, setTrilha] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getTrilha(id).then(setTrilha).catch((e) => setErro(e.message));
  }, [id]);

  const continuar = async (cursoId) => {
    try {
      await matricularCurso(cursoId);
      navigate(`/dashboard/cursos/${cursoId}`);
    } catch (e) {
      setErro(e.message);
    }
  };

  if (erro && !trilha) return <div className="alert alert-error">{erro}</div>;
  if (!trilha) return <p>Carregando trilha...</p>;

  return (
    <div>
      <Link to="/dashboard/trilhas" className="btn btn-outline btn-sm">← Trilhas</Link>
      <h1>{trilha.titulo}</h1>
      {trilha.descricao && <p>{trilha.descricao}</p>}
      {erro && <div className="alert alert-error">{erro}</div>}

      <ol className="dash-list">
        {trilha.cursos.map((c) => (
          <li key={c.id} className="dash-list-item">
            <div>
              <strong>{c.titulo}</strong>
              <div className="dash-progress">
                <div className="dash-progress-bar" style={{ width: `${c.progresso}%` }} />
              </div>
              <small>{c.progresso}% — {c.matriculado ? "Em andamento" : "Não iniciado"}</small>
            </div>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => continuar(c.id)}>
              {c.progresso > 0 ? "Continuar" : "Matricular"}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
