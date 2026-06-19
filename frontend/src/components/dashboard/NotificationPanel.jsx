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
        <ul className="dash-list">
          {itens.map((c) => (
            <li key={c.id} className="dash-list-item">
              <span>{ICON[c.tipo] || "ℹ️"}</span>
              <div>
                <strong>{c.titulo}</strong>
                <small>{new Date(c.criado_em).toLocaleString("pt-BR")}</small>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => marcar(c.id)}>
                Marcar lido
              </button>
            </li>
          ))}
          {itens.length === 0 && <li>Nenhuma notificação nova.</li>}
        </ul>
        <Link to="/dashboard/comunicados" className="btn btn-outline btn-sm" onClick={onClose}>
          Ver todos os comunicados
        </Link>
      </aside>
    </div>
  );
}
