import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getCatalogoCursos } from "../services/api";

export default function ExplorarCursosPage() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState("");

  const buscar = (termo) => {
    if (termo?.trim().length >= 2) {
      navigate(`/dashboard/busca?q=${encodeURIComponent(termo.trim())}`);
      return;
    }
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
    getCatalogoCursos()
      .then(setCursos)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-page">
      <PageHeader
        icon="📚"
        titulo="Explorar cursos"
        subtitulo="Escolha um curso específico — não precisa fazer a trilha inteira."
      >
        <form
          className="dash-page-search"
          onSubmit={(e) => {
            e.preventDefault();
            buscar(q);
          }}
        >
          <input
            type="search"
            placeholder="Buscar por título ou tema..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={buscando}>
            {buscando ? "..." : "Buscar"}
          </button>
        </form>
      </PageHeader>

      {erro && <div className="alert alert-error">{erro}</div>}
      {loading && <PageSkeleton cards={4} />}

      {!loading && cursos.length > 0 && (
        <div className="dash-card-grid">
          {cursos.map((c, i) => (
            <Link
              key={c.id}
              to={`/dashboard/curso/${c.id}`}
              className="dash-card dash-card--clickable dash-curso-card"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {c.is_novo && <span className="dash-badge-novo">Novo</span>}
              <span className="dash-card-icon dash-card-icon--green">📚</span>
              <h3>{c.titulo}</h3>
              {c.setor_nome && <span className="dash-tag">{c.setor_nome}</span>}
              {c.tags?.length > 0 && (
                <div className="dash-tags-row">
                  {c.tags.map((t) => (
                    <span key={t.id} className="dash-tag dash-tag--muted">{t.nome}</span>
                  ))}
                </div>
              )}
              <div className="dash-curso-duracao">
                <span>📦 {c.total_modulos} módulos</span>
                <span>⏱️ {c.duracao_horas}h</span>
              </div>
              <div className="dash-card-footer">
                <span className="dash-card-meta">Ver detalhes →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && cursos.length === 0 && (
        <EmptyState
          icon="🔎"
          titulo="Nenhum curso encontrado"
          descricao="Não há cursos publicados no momento."
        />
      )}
    </div>
  );
}
