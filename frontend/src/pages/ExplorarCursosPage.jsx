import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCatalogoCursos, matricularCurso } from "../services/api";

export default function ExplorarCursosPage() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [q, setQ] = useState("");
  const [erro, setErro] = useState("");

  const buscar = () => {
    getCatalogoCursos({ q: q || undefined }).then(setCursos).catch((e) => setErro(e.message));
  };

  useEffect(() => {
    buscar();
  }, []);

  const inscrever = async (id) => {
    try {
      await matricularCurso(id);
      navigate(`/dashboard/cursos/${id}`);
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div>
      <h1>Explorar cursos</h1>
      <div className="dash-search" style={{ maxWidth: 400, marginBottom: "1rem" }}>
        <input
          type="search"
          placeholder="Buscar cursos..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={buscar}>Buscar</button>
      </div>
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="dash-scroll-row">
        {cursos.map((c) => (
          <article key={c.id} className="dash-course-card">
            <h3>{c.titulo}</h3>
            {c.setor_nome && <span className="dash-tag">{c.setor_nome}</span>}
            <small>{c.total_modulos} módulos · {c.duracao_horas}h</small>
            {c.is_novo && <span className="dash-badge-novo">Novo</span>}
            <button type="button" className="btn btn-primary btn-sm" onClick={() => inscrever(c.id)}>
              Inscrever-se
            </button>
          </article>
        ))}
        {cursos.length === 0 && <p>Nenhum curso encontrado.</p>}
      </div>
    </div>
  );
}
