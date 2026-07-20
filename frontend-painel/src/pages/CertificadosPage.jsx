import { useEffect, useState } from "react";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { certificadoDownloadUrl, getAccessToken, getCertificados } from "../services/api";

export default function CertificadosPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    getCertificados()
      .then(setCerts)
      .finally(() => setLoading(false));
  }, []);

  const baixar = (id) => {
    const token = getAccessToken();
    fetch(certificadoDownloadUrl(id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificado-${id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="dash-page">
      <PageHeader
        icon="🏅"
        titulo="Meus certificados"
        subtitulo="Conquistas emitidas ao concluir os cursos da plataforma."
      >
        {!loading && certs.length > 0 && (
          <div className="dash-stat-card">
            <span className="dash-stat-label">Total</span>
            <strong>{certs.length}</strong>
          </div>
        )}
      </PageHeader>

      {loading && <PageSkeleton cards={3} />}

      {!loading && certs.length > 0 && (
        <div className="dash-card-grid">
          {certs.map((c, i) => (
            <article
              key={c.id}
              className="dash-card dash-cert-card dash-card--clickable"
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => setDetalhe(c)}
              onKeyDown={(e) => e.key === "Enter" && setDetalhe(c)}
              role="button"
              tabIndex={0}
            >
              <span className="dash-cert-ribbon">🏅</span>
              <h3>{c.curso_titulo}</h3>
              <span className="dash-card-meta">
                Emitido em {new Date(c.emitido_em).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </span>
              <div className="dash-card-footer">
                <span className="dash-badge-inscrito">Certificado válido</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && certs.length === 0 && (
        <EmptyState
          icon="🎓"
          titulo="Nenhum certificado ainda"
          descricao="Conclua um curso e seja aprovado na prova final para receber seu certificado."
        />
      )}

      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title="Detalhe do certificado">
        {detalhe && (
          <div className="gestao-form">
            <p><strong>Curso:</strong> {detalhe.curso_titulo}</p>
            <p><strong>Data de emissão:</strong> {new Date(detalhe.emitido_em).toLocaleDateString("pt-BR")}</p>
            <button type="button" className="btn btn-primary" onClick={() => baixar(detalhe.id)}>
              ⬇ Baixar certificado
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
