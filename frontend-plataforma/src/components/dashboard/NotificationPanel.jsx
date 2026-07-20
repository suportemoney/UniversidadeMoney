import { Link } from "react-router-dom";
import { marcarComunicadoLido } from "../../services/api";

const ICON = { info: "ℹ️", trofeu: "🏆", megafone: "📣" };

export default function NotificationPanel({ open, onClose, itens, onAtualizar }) {
  if (!open) return null;

  const marcar = async (id) => {
    await marcarComunicadoLido(id);
    onAtualizar();
  };

  return (
    <div className="notif-overlay" onClick={onClose} role="presentation">
      <aside className="notif-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notif-panel-header">
          <h2>Notificações</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>

        {itens.length === 0 ? (
          <div className="dash-empty" style={{ padding: "2rem 1rem" }}>
            <span className="dash-empty-icon">🔔</span>
            <p>Tudo em dia! Nenhuma notificação nova.</p>
          </div>
        ) : (
          <div className="dash-feed">
            {itens.map((c, i) => (
              <article
                key={c.id}
                className={`dash-feed-item dash-feed-item--${c.tipo || "info"}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="dash-feed-icon">{ICON[c.tipo] || "ℹ️"}</span>
                <div className="dash-feed-body">
                  <strong>{c.titulo}</strong>
                  <span className="dash-feed-time">
                    {new Date(c.criado_em).toLocaleString("pt-BR")}
                  </span>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => marcar(c.id)}>
                  ✓
                </button>
              </article>
            ))}
          </div>
        )}

        <Link
          to="/dashboard/comunicados"
          className="btn btn-outline btn-sm"
          style={{ marginTop: "1rem", width: "100%", textAlign: "center" }}
          onClick={onClose}
        >
          Ver todos os comunicados
        </Link>
      </aside>
    </div>
  );
}
