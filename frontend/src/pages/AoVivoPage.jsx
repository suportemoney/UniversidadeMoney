import { useEffect, useState } from "react";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/dashboard/EmptyState";
import PageHeader from "../components/dashboard/PageHeader";
import PageSkeleton from "../components/dashboard/PageSkeleton";
import { getAoVivo, inscreverAoVivo } from "../services/api";

function formatData(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return {
    dia: d.toLocaleDateString("pt-BR", { day: "2-digit" }),
    mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
    completo: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
  };
}

export default function AoVivoPage() {
  const [treinos, setTreinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState("");

  const carregar = () => {
    setLoading(true);
    getAoVivo()
      .then(setTreinos)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const inscrever = async () => {
    try {
      await inscreverAoVivo(confirm.id);
      setMsg(`Inscrição confirmada: ${confirm.titulo}`);
      setConfirm(null);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div className="dash-page">
      <PageHeader
        icon="🎥"
        titulo="Treinamentos ao vivo"
        subtitulo="Workshops e sessões ao vivo com a equipe Money Promotora."
      />

      {erro && <div className="alert alert-error">{erro}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}
      {loading && <PageSkeleton cards={2} />}

      {!loading && treinos.length > 0 && (
        <div className="dash-card-grid dash-card-grid--wide">
          {treinos.map((t, i) => {
            const data = formatData(t.data);
            return (
              <article
                key={t.id}
                className="dash-card dash-live-card"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="dash-live-badge">
                  <span className="dash-live-dot" />
                  Ao vivo
                </span>
                <div className="dash-live-date-lg">
                  <div className="dash-live-date">
                    <strong>{data.dia}</strong>
                    <small>{data.mes}</small>
                  </div>
                  <div>
                    <span className="dash-card-meta">{data.completo}</span>
                    <br />
                    <strong style={{ color: "var(--navy)" }}>{t.hora}</strong>
                  </div>
                </div>
                <h3>{t.titulo}</h3>
                {t.setor && <span className="dash-tag">{t.setor}</span>}
                {t.descricao && <p className="dash-card-meta">{t.descricao}</p>}
                <div className="dash-card-footer">
                  {t.inscrito ? (
                    <span className="dash-badge-inscrito">✓ Inscrito</span>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirm(t)}>
                      Inscrever-se
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && treinos.length === 0 && (
        <EmptyState
          icon="📅"
          titulo="Nenhum treinamento agendado"
          descricao="Fique de olho — novos eventos ao vivo aparecerão aqui."
        />
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Confirmar inscrição">
        <p>Deseja se inscrever em <strong>{confirm?.titulo}</strong>?</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirm(null)}>Cancelar</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={inscrever}>Confirmar</button>
        </div>
      </Modal>
    </div>
  );
}
