import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getCatalogoCursos, matricularCurso } from "../services/api";

export default function ExplorarCursosPage() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const buscar = (termo) => {
    setBuscando(true);
    getCatalogoCursos({ q: termo || undefined })
      .then(setCursos)
      .catch((e) => setErro(e.message))
      .finally(() => {
        setLoading(false);
        setBuscando(false);
      });
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
    <div className="dash-page">
      <PageHeader
        icon="🔍"
        titulo="Explorar cursos"
        subtitulo="Catálogo completo de cursos disponíveis na plataforma."
      >
        <div className="dash-page-search">
          <input
            type="search"
            placeholder="Buscar por título ou tema..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar(q)}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => buscar(q)}
            disabled={buscando}
          >
            {buscando ? "..." : "Buscar"}
          </button>
        </div>
      </PageHeader>

      {erro && <div className="alert alert-error">{erro}</div>}
      {loading && <PageSkeleton cards={4} />}

      {!loading && cursos.length > 0 && (
        <div className="dash-card-grid">
          {cursos.map((c, i) => (
            <article
              key={c.id}
              className="dash-card dash-curso-card"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {c.is_novo && <span className="dash-badge-novo">Novo</span>}
              <span className="dash-card-icon dash-card-icon--green">📚</span>
              <h3>{c.titulo}</h3>
              {c.setor_nome && <span className="dash-tag">{c.setor_nome}</span>}
              <div className="dash-curso-duracao">
                <span>📦 {c.total_modulos} módulos</span>
                <span>⏱️ {c.duracao_horas}h</span>
              </div>
              <div className="dash-card-footer">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => inscrever(c.id)}>
                  Inscrever-se
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && cursos.length === 0 && (
        <EmptyState
          icon="🔎"
          titulo="Nenhum curso encontrado"
          descricao={q ? `Sem resultados para "${q}". Tente outro termo.` : "Não há cursos publicados no momento."}
        />
      )}
    </div>
  );
}
