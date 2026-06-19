import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscar } from "../../services/api";

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
    if (tipo === "curso") navigate(`/dashboard/explorar`);
    else if (tipo === "trilha") navigate(`/dashboard/trilhas/${id}`);
    else if (url) window.open(url, "_blank");
  };

  return (
    <div className="search-overlay" onClick={onClose} role="presentation">
      <div className="search-overlay-box" onClick={(e) => e.stopPropagation()}>
        {loading && <p>Buscando...</p>}
        {resultados && (
          <>
            {resultados.cursos?.length > 0 && (
              <section>
                <h3>Cursos</h3>
                <ul>
                  {resultados.cursos.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => ir("curso", c.id)}>{c.titulo}</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {resultados.trilhas?.length > 0 && (
              <section>
                <h3>Trilhas</h3>
                <ul>
                  {resultados.trilhas.map((t) => (
                    <li key={t.id}>
                      <button type="button" onClick={() => ir("trilha", t.id)}>{t.titulo}</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {resultados.biblioteca?.length > 0 && (
              <section>
                <h3>Biblioteca</h3>
                <ul>
                  {resultados.biblioteca.map((b) => (
                    <li key={b.id}>
                      <button type="button" onClick={() => ir("biblioteca", b.id, b.url)}>{b.titulo}</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {!resultados.cursos?.length && !resultados.trilhas?.length && !resultados.biblioteca?.length && (
              <p>Nenhum resultado para &quot;{query}&quot;</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
