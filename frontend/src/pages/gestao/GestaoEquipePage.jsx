import { useEffect, useState } from "react";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoEquipePage() {
  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState("");
  const [erro, setErro] = useState("");

  const carregar = () => {
    gestaoApi.usuarios(q).then(setUsuarios).catch((e) => setErro(e.message));
  };

  useEffect(() => {
    carregar();
  }, []);

  const toggle = async (user) => {
    try {
      await gestaoApi.toggleEquipe(user.id, !user.is_membro_equipe);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  return (
    <div>
      <h1>Equipe de gestão</h1>
      <p className="gestao-muted">Promova contas cadastradas para criar e editar conteúdo.</p>
      {erro && <div className="alert alert-error">{erro}</div>}
      <div className="gestao-search-row">
        <input
          type="search"
          placeholder="Buscar por nome ou e-mail..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={carregar}>Buscar</button>
      </div>
      <table className="gestao-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Cargo</th>
            <th>Membro da equipe</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.first_name}</td>
              <td>{u.email}</td>
              <td>{u.cargo}</td>
              <td>
                {u.is_superuser ? (
                  <span className="gestao-badge">Superuser</span>
                ) : (
                  <button
                    type="button"
                    className={`btn btn-sm ${u.is_membro_equipe ? "btn-primary" : "btn-outline"}`}
                    onClick={() => toggle(u)}
                  >
                    {u.is_membro_equipe ? "Remover" : "Promover"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
