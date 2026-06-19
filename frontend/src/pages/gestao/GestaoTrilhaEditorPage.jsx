import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoTrilhaEditorPage() {
  const { id } = useParams();
  const [trilha, setTrilha] = useState(null);
  const [disponiveis, setDisponiveis] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    gestaoApi.obterTrilha(id).then((t) => {
      setTrilha(t);
      setSelecionados(t.itens?.map((i) => i.curso) || []);
    });
    gestaoApi.cursosDisponiveis().then(setDisponiveis);
  }, [id]);

  const toggle = (cursoId) => {
    setSelecionados((prev) =>
      prev.includes(cursoId) ? prev.filter((c) => c !== cursoId) : [...prev, cursoId]
    );
  };

  const mover = (idx, dir) => {
    const n = [...selecionados];
    const j = idx + dir;
    if (j < 0 || j >= n.length) return;
    [n[idx], n[j]] = [n[j], n[idx]];
    setSelecionados(n);
  };

  const salvar = async () => {
    await gestaoApi.definirCursosTrilha(id, selecionados);
    setMsg("Trilha atualizada!");
  };

  if (!trilha) return <p>Carregando...</p>;

  const mapCursos = Object.fromEntries(disponiveis.map((c) => [c.id, c.titulo]));

  return (
    <div>
      <div className="gestao-page-header">
        <h1>{trilha.titulo}</h1>
        <Link to="/gestao/trilhas" className="btn btn-outline btn-sm">← Voltar</Link>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <h2>Cursos publicados disponíveis</h2>
      <div className="gestao-trilha-disponiveis">
        {disponiveis.map((c) => (
          <label key={c.id} className="gestao-check">
            <input
              type="checkbox"
              checked={selecionados.includes(c.id)}
              onChange={() => toggle(c.id)}
            />
            {c.titulo}
          </label>
        ))}
      </div>

      <h2>Ordem da trilha</h2>
      <ol className="gestao-trilha-ordem">
        {selecionados.map((cid, idx) => (
          <li key={cid}>
            {mapCursos[cid] || `Curso #${cid}`}
            <span>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => mover(idx, -1)}>↑</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => mover(idx, 1)}>↓</button>
            </span>
          </li>
        ))}
      </ol>

      <button type="button" className="btn btn-primary" onClick={salvar}>Salvar trilha</button>
    </div>
  );
}
