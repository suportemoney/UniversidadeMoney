import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

const STATUS = [
  { value: "", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "publicado", label: "Publicado" },
  { value: "arquivado", label: "Arquivado" },
];

export default function GestaoCursosPage() {
  const [cursos, setCursos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [excluir, setExcluir] = useState(null);

  const carregar = () => gestaoApi.listarCursos(filtro || undefined).then(setCursos);

  useEffect(() => {
    carregar();
  }, [filtro]);

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Cursos</h1>
        <Link to="/gestao/cursos/novo" className="btn btn-primary">Novo curso</Link>
      </div>
      <div className="gestao-filters">
        {STATUS.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`btn btn-sm ${filtro === s.value ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFiltro(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <table className="gestao-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Status</th>
            <th>Setor</th>
            <th>Módulos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((c) => (
            <tr key={c.id}>
              <td>{c.titulo}</td>
              <td><span className={`gestao-status gestao-status--${c.status}`}>{c.status}</span></td>
              <td>{c.setor_nome || "—"}</td>
              <td>{c.total_modulos}</td>
              <td>
                <Link to={`/gestao/cursos/${c.id}`}>Editar</Link>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(c)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => {
          await gestaoApi.excluirCurso(excluir.id);
          carregar();
        }}
        title="Excluir curso"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
