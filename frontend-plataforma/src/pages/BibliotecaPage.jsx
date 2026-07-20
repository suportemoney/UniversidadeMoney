import { useEffect, useState } from "react";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getBiblioteca } from "../services/api";

export default function BibliotecaPage() {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBiblioteca()
      .then(setMateriais)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-page">
      <PageHeader
        icon="📖"
        titulo="Biblioteca"
        subtitulo="Materiais em PDF hospedados na plataforma, organizados por setor."
      />

      {loading && <PageSkeleton cards={4} />}

      {!loading && materiais.length > 0 && (
        <div className="dash-card-grid">
          {materiais.map((m, i) => (
            <article
              key={m.id}
              className="dash-card dash-biblio-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="dash-card-icon dash-card-icon--red">📄</span>
              <h3>{m.titulo}</h3>
              {m.descricao && <p className="dash-card-meta">{m.descricao}</p>}
              {m.setor && <span className="dash-tag">{m.setor}</span>}
              <div className="dash-card-footer">
                {m.arquivo_url ? (
                  <a
                    href={m.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    Visualizar PDF
                  </a>
                ) : (
                  <small className="dash-card-meta">PDF indisponível</small>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && materiais.length === 0 && (
        <EmptyState
          icon="📚"
          titulo="Biblioteca vazia"
          descricao="Materiais complementares em PDF serão adicionados pela equipe de gestão."
        />
      )}
    </div>
  );
}
