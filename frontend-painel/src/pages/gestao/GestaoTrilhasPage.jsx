import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoBulkActions from "../../components/gestao/GestaoBulkActions";
import GestaoDataTable, { GestaoCellCurso, GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoPagination from "../../components/gestao/GestaoPagination";
import { GestaoSelectCell, GestaoSelectHeaderCell } from "../../components/gestao/GestaoTableCheckbox";
import GestaoTableActions from "../../components/gestao/GestaoTableActions";
import GestaoToolbar from "../../components/gestao/GestaoToolbar";
import useGestaoCrudTable from "../../hooks/useGestaoCrudTable";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoTrilhasPage() {
  const [trilhas, setTrilhas] = useState([]);
  const [modal, setModal] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState(null);
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarTrilhas().then(setTrilhas).finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (modal) {
      setTitulo("");
      setErro("");
    }
  }, [modal]);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(trilhas, { searchKeys: ["titulo"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((t) => t.id);

  const fecharModal = () => setModal(false);

  const criar = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSalvando(true);
    setErro("");
    try {
      await gestaoApi.criarTrilha({ titulo: titulo.trim() });
      fecharModal();
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirTrilha(id), { sucesso: "trilhas excluídas" });
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader
        icon="trilhas"
        title="Trilhas"
        subtitle="Organize sequências de cursos para os alunos"
      >
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal(true)}>
          <GestaoIcon name="mais" />
          Nova trilha
        </button>
      </GestaoPageHeader>

      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

      <GestaoToolbar
        bulkActions={(
          <GestaoBulkActions
            count={crud.selection.count}
            actionLabel="Excluir selecionadas"
            onAction={() => crud.setLoteOpen(true)}
            onClear={crud.selection.clear}
            loading={crud.loteLoading}
          />
        )}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar trilhas..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhuma trilha cadastrada"
        emptyMessage="Use o botão Nova trilha para começar."
        emptyAction={(
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
            Nova trilha
          </button>
        )}
        skeletonCols={4}
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
              disabled={!paginados.length}
            />
            <th>Trilha</th>
            <th>Cursos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((t, i) => (
            <GestaoTableRow key={t.id} index={i} selected={crud.selection.isSelected(t.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(t.id)}
                onChange={() => crud.selection.toggle(t.id)}
              />
              <td>
                <GestaoCellCurso titulo={t.titulo} descricao={`${t.itens?.length || 0} curso(s) na trilha`} />
              </td>
              <td>{t.itens?.length || 0}</td>
              <td>
                <GestaoTableActions
                  editTo={`/gestao/trilhas/${t.id}`}
                  editLabel="Montar"
                  onDelete={() => setExcluir(t)}
                />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal}
        onClose={fecharModal}
        title="Nova trilha"
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>Cancelar</button>
            <button type="submit" form="form-trilha" className="btn btn-primary btn-sm" disabled={salvando}>
              {salvando ? "Criando..." : "Criar trilha"}
            </button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-trilha" className="gestao-form gestao-form--modal" onSubmit={criar}>
          <label className="gestao-field">
            Nome da trilha
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Trilha de vendas"
              required
              autoFocus
            />
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => {
          await gestaoApi.excluirTrilha(excluir.id);
          carregar();
        }}
        title="Excluir trilha"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir trilhas selecionadas"
        message={`Excluir ${crud.selection.count} trilha(s) selecionada(s)?`}
        confirmLabel="Excluir selecionadas"
        danger
      />
    </div>
  );
}
