import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { buscar } from "../services/api";

const SECOES = [
  { key: "cursos", label: "Cursos", icon: "📚", rota: (id) => `/dashboard/curso/${id}` },
  { key: "trilhas", label: "Trilhas", icon: "🛤️", rota: (id) => `/dashboard/trilhas/${id}` },
  { key: "biblioteca", label: "PDFs da biblioteca", icon: "📄", externo: true },
  { key: "ao_vivo", label: "Workshops ao vivo", icon: "🎥", rota: () => "/dashboard/ao-vivo" },
];

function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function BuscaPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const qInicial = params.get("q") || "";
  const [termo, setTermo] = useState(qInicial);
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const executarBusca = (q) => {
    const limpo = q.trim();
    if (limpo.length < 2) {
      setResultados(null);
      setErro("Digite pelo menos 2 caracteres para buscar.");
      return;
    }
    setErro("");
    setLoading(true);
    setParams({ q: limpo });
    buscar(limpo)
      .then(setResultados)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (qInicial.length >= 2) {
      setTermo(qInicial);
      executarBusca(qInicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = resultados
    ? (resultados.cursos?.length || 0)
      + (resultados.trilhas?.length || 0)
      + (resultados.biblioteca?.length || 0)
      + (resultados.ao_vivo?.length || 0)
    : 0;

  return (
    <div className="dash-page">
      <PageHeader
        icon="🔍"
        titulo="Resultados da busca"
        subtitulo="Cursos, trilhas, PDFs e workshops ao vivo em um só lugar."
      >
        <form
          className="dash-page-search"
          onSubmit={(e) => {
            e.preventDefault();
            executarBusca(termo);
          }}
        >
          <input
            type="search"
            placeholder="O que você procura?"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? "..." : "Buscar"}
          </button>
        </form>
      </PageHeader>

      {erro && <div className="alert alert-error">{erro}</div>}

      {loading && <PageSkeleton cards={4} />}

      {!loading && resultados && (
        <>
          <p className="dash-busca-resumo">
            <strong>{total}</strong> resultado{total !== 1 ? "s" : ""} para &quot;{resultados.q}&quot;
          </p>

          {total === 0 ? (
            <EmptyState
              icon="🔎"
              titulo="Nada encontrado"
              descricao={`Não encontramos cursos, trilhas, PDFs ou workshops para "${resultados.q}".`}
              acao={<Link to="/dashboard/explorar" className="btn btn-primary">Explorar cursos</Link>}
            />
          ) : (
            SECOES.map(({ key, label, icon, rota, externo }) => {
              const itens = resultados[key];
              if (!itens?.length) return null;
              return (
                <section key={key} className="dash-busca-secao">
                  <h2>
                    <span>{icon}</span> {label}
                    <span className="dash-busca-count">{itens.length}</span>
                  </h2>
                  <div className="dash-card-grid">
                    {itens.map((item, i) => (
                      <article
                        key={item.id}
                        className="dash-card dash-busca-card"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <span className="dash-card-icon dash-card-icon--blue">{icon}</span>
                        <h3>{item.titulo}</h3>
                        {item.setor && <span className="dash-tag">{item.setor}</span>}

                        {key === "cursos" && (
                          <div className="dash-curso-duracao">
                            <span>📦 {item.total_modulos} módulos</span>
                            <span>⏱️ {item.duracao_horas}h</span>
                          </div>
                        )}

                        {key === "ao_vivo" && (
                          <span className="dash-card-meta">
                            📅 {formatData(item.data)} às {item.hora}
                          </span>
                        )}

                        <div className="dash-card-footer">
                          {externo && item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                            >
                              Abrir PDF
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(rota(item.id))}
                            >
                              {key === "cursos" ? "Ver curso" : key === "trilhas" ? "Ver trilha" : "Ver agenda"}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </>
      )}

      {!loading && !resultados && !erro && (
        <EmptyState
          icon="🔍"
          titulo="Busque na plataforma"
          descricao="Encontre cursos avulsos, trilhas, materiais em PDF e workshops ao vivo."
        />
      )}
    </div>
  );
}
