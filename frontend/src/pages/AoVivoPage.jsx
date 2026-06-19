import { useEffect, useState } from "react";
import Modal from "../components/ui/Modal";
import { getAoVivo, inscreverAoVivo } from "../services/api";

function formatData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AoVivoPage() {
  const [treinos, setTreinos] = useState([]);
  const [erro, setErro] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState("");

  const carregar = () => getAoVivo().then(setTreinos).catch((e) => setErro(e.message));

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
    <div>
      <h1>Treinamentos ao vivo</h1>
      {erro && <div className="alert alert-error">{erro}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="dash-grid-2">
        {treinos.map((t) => (
          <article key={t.id} className="dash-panel">
            <div className="dash-live-date">
              <strong>{formatData(t.data)}</strong>
              <small>{t.hora}</small>
            </div>
            <h3>{t.titulo}</h3>
            {t.setor && <span className="dash-tag">{t.setor}</span>}
            {t.descricao && <p>{t.descricao}</p>}
            {t.inscrito ? (
              <span className="dash-badge-novo">Inscrito</span>
            ) : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setConfirm(t)}>
                Inscrever-se
              </button>
            )}
          </article>
        ))}
        {treinos.length === 0 && <p>Nenhum treinamento agendado.</p>}
      </div>

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
