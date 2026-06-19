import { useEffect, useState } from "react";
import { getRanking } from "../services/api";

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    getRanking(50).then(setRanking);
  }, []);

  return (
    <div>
      <h1>Ranking de evolução</h1>
      <table className="gestao-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Colaborador</th>
            <th>Horas</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((r, i) => (
            <tr key={r.nome}>
              <td>{i + 1}</td>
              <td>
                <span className="dash-avatar dash-avatar-sm">{r.nome.charAt(0)}</span>
                {r.nome}
              </td>
              <td><strong>{r.horas}h</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
      {ranking.length === 0 && <p>Complete cursos para aparecer no ranking.</p>}
    </div>
  );
}
