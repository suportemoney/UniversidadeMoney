import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoTrilhasPage() {
  const [trilhas, setTrilhas] = useState([]);
  const [titulo, setTitulo] = useState("");

  const carregar = () => gestaoApi.listarTrilhas().then(setTrilhas);

  useEffect(() => {
    carregar();
  }, []);

  const criar = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    await gestaoApi.criarTrilha({ titulo });
    setTitulo("");
    carregar();
  };

  return (
    <div>
      <h1>Trilhas</h1>
      <form className="gestao-form gestao-form-inline" onSubmit={criar}>
        <input
          placeholder="Nome da nova trilha"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <button type="submit" className="btn btn-primary btn-sm">Criar trilha</button>
      </form>
      <table className="gestao-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Cursos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {trilhas.map((t) => (
            <tr key={t.id}>
              <td>{t.titulo}</td>
              <td>{t.itens?.length || 0}</td>
              <td><Link to={`/gestao/trilhas/${t.id}`}>Montar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
