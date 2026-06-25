import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoBulkActions from "../../components/gestao/GestaoBulkActions";
import GestaoDataTable, { GestaoCellCurso, GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoPagination from "../../components/gestao/GestaoPagination";
import { GestaoSelectCell, GestaoSelectHeaderCell } from "../../components/gestao/GestaoTableCheckbox";
import GestaoSearchInput from "../../components/gestao/GestaoSearchInput";
import useGestaoCrudTable from "../../hooks/useGestaoCrudTable";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";

function podeSelecionarEquipe(u) {
  return !u.is_superuser && u.is_membro_equipe;
}

export default function GestaoEquipePage() {
  const [usuarios, setUsuarios] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const crud = useGestaoCrudTable();

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
  const pageIds = paginados.filter(podeSelecionarEquipe).map((u) => u.id);

  const confirmarLote = async () => {
    await crud.confirmarLote(
      (id) => gestaoApi.toggleEquipe(id, false),
      { sucesso: "membros removidos da equipe" }
    );
    carregar();
  };

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
      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

      <div className="gestao-toolbar-wrap gestao-animate-in gestao-animate-in--delay-1">
        <GestaoBulkActions
          count={crud.selection.count}
          actionLabel="Remover selecionados da equipe"
          onAction={() => crud.setLoteOpen(true)}
          onClear={crud.selection.clear}
          loading={crud.loteLoading}
        />
        <div className="gestao-toolbar">
          <GestaoSearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome ou e-mail..."
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={buscarApi}>Buscar</button>
        </div>
      </div>

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum usuário encontrado"
        skeletonCols={5}
        footer={!vazio && !loading ? (
          <GestaoPagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
        ) : null}
      >
        <thead>
          <tr>
            <GestaoSelectHeaderCell
              checked={crud.selection.isAllSelected(pageIds)}
              indeterminate={crud.selection.isIndeterminate(pageIds)}
              onChange={() => crud.selection.toggleAll(pageIds)}
              disabled={!pageIds.length}
            />
            <th>Colaborador</th>
            <th>E-mail</th>
            <th>Cargo</th>
            <th>Equipe</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((u, i) => (
            <GestaoTableRow key={u.id} index={i} selected={crud.selection.isSelected(u.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(u.id)}
                onChange={() => crud.selection.toggle(u.id)}
                disabled={!podeSelecionarEquipe(u)}
              />
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

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Remover membros da equipe"
        message={`Remover ${crud.selection.count} colaborador(es) selecionado(s) da equipe de gestão?`}
        confirmLabel="Remover selecionados"
        danger
      />
    </div>
  );
}
