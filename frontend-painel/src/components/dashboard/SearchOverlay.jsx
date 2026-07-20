import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { buscar } from "../../services/api";

const ICONES = { cursos: "📚", trilhas: "🛤️", biblioteca: "📄", ao_vivo: "🎥" };

/** Preview rápido — Enter abre a página completa de busca */
export default function SearchOverlay({ query, onVerTodos }) {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResultados(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      buscar(query)
        .then(setResultados)
        .catch(() => setResultados({ cursos: [], trilhas: [], biblioteca: [], ao_vivo: [] }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (!query || query.length < 2) return null;

  const total = resultados
    ? (resultados.cursos?.length || 0)
      + (resultados.trilhas?.length || 0)
      + (resultados.biblioteca?.length || 0)
      + (resultados.ao_vivo?.length || 0)
    : 0;

  const ir = (tipo, id, url) => {
    onVerTodos();
    if (tipo === "curso") navigate(`/dashboard/curso/${id}`);
    else if (tipo === "trilha") navigate(`/dashboard/trilhas/${id}`);
    else if (tipo === "ao_vivo") navigate("/dashboard/ao-vivo");
    else if (url) window.open(url, "_blank");
  };

  const grupos = [
    { key: "cursos", label: "Cursos", tipo: "curso" },
    { key: "trilhas", label: "Trilhas", tipo: "trilha" },
    { key: "biblioteca", label: "PDFs", tipo: "biblioteca" },
    { key: "ao_vivo", label: "Ao vivo", tipo: "ao_vivo" },
  ];

  return (
    <div className="search-overlay" onClick={onVerTodos} role="presentation">
      <div className="search-overlay-box" onClick={(e) => e.stopPropagation()}>
        <div className="search-overlay-top">
          <p className="dash-card-meta">
            Resultados para <strong>&quot;{query}&quot;</strong>
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/dashboard/busca?q=${encodeURIComponent(query)}`)}
          >
            Ver todos →
          </button>
        </div>

        {loading && <div className="dash-skeleton" style={{ height: 100 }} />}

        {!loading && resultados && grupos.map(({ key, label, tipo }) => {
          const itens = resultados[key];
          if (!itens?.length) return null;
          return (
            <section key={key}>
              <h3>{ICONES[key]} {label}</h3>
              <ul>
                {itens.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => ir(tipo, item.id, item.url)}>
                      {item.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {!loading && resultados && total === 0 && (
          <p className="dash-card-meta">Nenhum resultado. Tente outro termo.</p>
        )}

        {!loading && total > 0 && (
          <button
            type="button"
            className="search-overlay-ver-todos"
            onClick={() => navigate(`/dashboard/busca?q=${encodeURIComponent(query)}`)}
          >
            Ver {total} resultado{total !== 1 ? "s" : ""} completo{total !== 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
