import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoTrilhaEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trilha, setTrilha] = useState(null);
  const [disponiveis, setDisponiveis] = useState([]);
  const [setores, setSetores] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [msg, setMsg] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", setor: "" });
  const [confirmExcluir, setConfirmExcluir] = useState(false);

  useEffect(() => {
    gestaoApi.obterTrilha(id).then((t) => {
      setTrilha(t);
      setForm({ titulo: t.titulo, descricao: t.descricao || "", setor: t.setor || "" });
      setSelecionados(t.itens?.map((i) => i.curso) || []);
    });
    gestaoApi.cursosDisponiveis().then(setDisponiveis);
    gestaoApi.setores().then(setSetores);
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

  const salvarInfo = async (e) => {
    e.preventDefault();
    await gestaoApi.atualizarTrilha(id, {
      titulo: form.titulo,
      descricao: form.descricao,
      setor: form.setor ? Number(form.setor) : null,
    });
    setEditOpen(false);
    gestaoApi.obterTrilha(id).then(setTrilha);
    setMsg("Informações salvas.");
  };

  const excluir = async () => {
    await gestaoApi.excluirTrilha(id);
    navigate("/gestao/trilhas");
  };

  if (!trilha) return <p>Carregando...</p>;

  const mapCursos = Object.fromEntries(disponiveis.map((c) => [c.id, c.titulo]));

  return (
    <div>
      <div className="gestao-page-header">
        <h1>{trilha.titulo}</h1>
        <div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditOpen(true)}>Editar info</button>
          {" "}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmExcluir(true)}>Excluir trilha</button>
          {" "}
          <Link to="/gestao/trilhas" className="btn btn-outline btn-sm">← Voltar</Link>
        </div>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <h2>Cursos publicados disponíveis</h2>
      <div className="gestao-trilha-disponiveis">
        {disponiveis.map((c) => (
          <label key={c.id} className="gestao-check">
            <input type="checkbox" checked={selecionados.includes(c.id)} onChange={() => toggle(c.id)} />
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

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar trilha">
        <form className="gestao-form" onSubmit={salvarInfo}>
          <label>Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <label>Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></label>
          <label>Setor
            <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
              <option value="">Geral</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmExcluir}
        onClose={() => setConfirmExcluir(false)}
        onConfirm={excluir}
        title="Excluir trilha"
        message={`Excluir "${trilha.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
