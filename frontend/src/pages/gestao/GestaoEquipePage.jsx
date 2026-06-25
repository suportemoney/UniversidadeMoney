import { useEffect, useMemo, useState } from "react";
import GestaoDataTable, { GestaoCellCurso, GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoPagination from "../../components/gestao/GestaoPagination";
import GestaoSearchInput from "../../components/gestao/GestaoSearchInput";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoEquipePage() {
  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = (termo = q) => {
    setLoading(true);
    return gestaoApi.usuarios(termo)
      .then(setUsuarios)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar("");
  }, []);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(usuarios, { searchKeys: ["first_name", "email", "cargo"], pageSize: 10 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);

  const toggle = async (user) => {
    try {
      await gestaoApi.toggleEquipe(user.id, !user.is_membro_equipe);
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const buscarApi = () => {
    setQ(busca);
    carregar(busca);
  };

  return (
    <div>
      <GestaoPageHeader
        icon="equipe"
        title="Equipe de gestão"
        subtitle="Promova contas cadastradas para criar e editar conteúdo"
      />

      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}

      <div className="gestao-toolbar gestao-animate-in gestao-animate-in--delay-1">
        <GestaoSearchInput
          value={busca}
          onChange={setBusca}
          placeholder="Buscar por nome ou e-mail..."
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={buscarApi}>Buscar</button>
      </div>

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum usuário encontrado"
        skeletonCols={4}
        footer={!vazio && !loading ? (
          <GestaoPagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
        ) : null}
      >
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>E-mail</th>
            <th>Cargo</th>
            <th>Equipe</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((u, i) => (
            <GestaoTableRow key={u.id} index={i}>
              <td><GestaoCellCurso titulo={u.first_name} /></td>
              <td>{u.email}</td>
              <td>{u.cargo || "—"}</td>
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
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>
    </div>
  );
}
