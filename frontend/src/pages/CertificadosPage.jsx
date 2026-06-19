import { useEffect, useState } from "react";
import Modal from "../components/ui/Modal";
import { certificadoDownloadUrl, getAccessToken, getCertificados } from "../services/api";

export default function CertificadosPage() {
  const [certs, setCerts] = useState([]);
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    getCertificados().then(setCerts);
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
    <div>
      <h1>Meus certificados</h1>
      <div className="dash-scroll-row">
        {certs.map((c) => (
          <article key={c.id} className="dash-course-card" onClick={() => setDetalhe(c)} role="button" tabIndex={0}>
            <span>🏅</span>
            <h3>{c.curso_titulo}</h3>
            <small>Emitido em {new Date(c.emitido_em).toLocaleDateString("pt-BR")}</small>
          </article>
        ))}
        {certs.length === 0 && <p>Você ainda não possui certificados.</p>}
      </div>

      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title="Detalhe do certificado">
        {detalhe && (
          <>
            <p><strong>Curso:</strong> {detalhe.curso_titulo}</p>
            <p><strong>Data:</strong> {new Date(detalhe.emitido_em).toLocaleDateString("pt-BR")}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => baixar(detalhe.id)}>
              Baixar certificado
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
