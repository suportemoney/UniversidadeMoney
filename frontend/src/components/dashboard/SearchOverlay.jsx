import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscar } from "../../services/api";

const ICONES = { curso: "📚", trilha: "🛤️", biblioteca: "📄" };

export default function SearchOverlay({ query, onClose }) {
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
        .catch(() => setResultados({ cursos: [], trilhas: [], biblioteca: [] }))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  if (!query || query.length < 2) return null;

  const ir = (tipo, id, url) => {
    onClose();
    if (tipo === "curso") navigate("/dashboard/explorar");
    else if (tipo === "trilha") navigate(`/dashboard/trilhas/${id}`);
    else if (url) window.open(url, "_blank");
  };

  const grupos = resultados ? [
    { key: "cursos", label: "Cursos", tipo: "curso" },
    { key: "trilhas", label: "Trilhas", tipo: "trilha" },
    { key: "biblioteca", label: "Biblioteca", tipo: "biblioteca" },
  ] : [];

  return (
    <div className="search-overlay" onClick={onClose} role="presentation">
      <div className="search-overlay-box" onClick={(e) => e.stopPropagation()}>
        <p className="dash-card-meta" style={{ margin: "0 0 0.5rem" }}>
          Resultados para <strong>&quot;{query}&quot;</strong>
        </p>

        {loading && (
          <div className="dash-skeleton" style={{ height: 120 }} />
        )}

        {!loading && resultados && grupos.map(({ key, label, tipo }) => {
          const itens = resultados[key];
          if (!itens?.length) return null;
          return (
            <section key={key}>
              <h3>{label}</h3>
              <ul>
                {itens.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => ir(tipo, item.id, item.url)}>
                      <span>{ICONES[tipo]}</span> {item.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {!loading && resultados && !resultados.cursos?.length && !resultados.trilhas?.length && !resultados.biblioteca?.length && (
          <p className="dash-card-meta">Nenhum resultado encontrado.</p>
        )}
      </div>
    </div>
  );
}
