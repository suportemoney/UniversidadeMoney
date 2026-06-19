import { useEffect, useState } from "react";
import { getProgresso } from "../services/api";

export default function ProgressoPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getProgresso().then(setData);
  }, []);

  if (!data) return <p>Carregando progresso...</p>;

  const maxHoras = Math.max(...data.por_setor.map((s) => s.horas), 1);

  return (
    <div>
      <h1>Meu progresso</h1>
      <div className="dash-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-label">Horas totais</span>
          <strong>{data.horas_totais}h</strong>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Em andamento</span>
          <strong>{data.em_andamento}</strong>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Concluídos</span>
          <strong>{data.concluidos}</strong>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-label">Certificados</span>
          <strong>{data.certificados}</strong>
        </div>
      </div>

      <section className="dash-section">
        <h2>Progresso por setor</h2>
        {data.por_setor.map((s) => (
          <div key={s.setor} className="dash-progress-setor">
            <div className="dash-progress-setor-header">
              <strong>{s.setor}</strong>
              <small>{s.concluidos}/{s.total} cursos · {s.horas.toFixed(1)}h</small>
            </div>
            <div className="dash-progress dash-progress--bar">
              <div
                className="dash-progress-bar"
                style={{ width: `${(s.horas / maxHoras) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {data.por_setor.length === 0 && <p>Nenhum curso iniciado ainda.</p>}
      </section>
    </div>
  );
}
