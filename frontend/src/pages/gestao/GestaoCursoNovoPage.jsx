import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoCursoNovoPage() {
  const navigate = useNavigate();
  const [setores, setSetores] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [setor, setSetor] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gestaoApi.setores().then(setSetores);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const curso = await gestaoApi.criarCurso({
        titulo,
        descricao,
        setor: setor || null,
      });
      navigate(`/gestao/cursos/${curso.id}`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <GestaoPageHeader
        icon="cursos"
        title="Novo curso"
        subtitle="Preencha as informações básicas para começar a montar o conteúdo"
      />
      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      <form className="gestao-form gestao-form-card" onSubmit={handleSubmit}>
        <label>
          Título
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </label>
        <label>
          Descrição
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />
        </label>
        <label>
          Setor
          <select value={setor} onChange={(e) => setSetor(e.target.value)}>
            <option value="">Selecione...</option>
            {setores.map((s) => (
              <option key={s.id} value={s.id}>{s.nome}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Criando..." : "Criar curso"}
        </button>
      </form>
    </div>
  );
}
