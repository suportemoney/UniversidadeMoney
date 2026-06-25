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
import StatusBadge from "../../components/gestao/StatusBadge";
import useGestaoCrudTable from "../../hooks/useGestaoCrudTable";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";

const TIPOS = [
  { value: "info", label: "Informação" },
  { value: "trofeu", label: "Conquista" },
  { value: "megafone", label: "Aviso" },
];

export default function GestaoComunicadosPage() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", tipo: "info" });
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarComunicados().then(setItens).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({ titulo: modal.item.titulo, conteudo: modal.item.conteudo, tipo: modal.item.tipo });
    } else {
      setForm({ titulo: "", conteudo: "", tipo: "info" });
    }
  }, [modal]);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(itens, { searchKeys: ["titulo"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((c) => c.id);

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirComunicado(id), { sucesso: "comunicados excluídos" });
    carregar();
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (modal.item) {
      await gestaoApi.atualizarComunicado(modal.item.id, form);
    } else {
      await gestaoApi.criarComunicado(form);
    }
    setModal({ open: false, item: null });
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader icon="comunicados" title="Comunicados" subtitle="Envie avisos e novidades para os colaboradores">
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal({ open: true, item: null })}>
          <GestaoIcon name="mais" />
          Novo comunicado
        </button>
      </GestaoPageHeader>

      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

      <GestaoToolbar
        bulkActions={(
          <GestaoBulkActions
            count={crud.selection.count}
            actionLabel="Excluir selecionados"
            onAction={() => crud.setLoteOpen(true)}
            onClear={crud.selection.clear}
            loading={crud.loteLoading}
          />
        )}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar comunicados..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum comunicado"
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
              disabled={!paginados.length}
            />
            <th>Comunicado</th><th>Tipo</th><th>Data</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((c, i) => (
            <GestaoTableRow key={c.id} index={i} selected={crud.selection.isSelected(c.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(c.id)}
                onChange={() => crud.selection.toggle(c.id)}
              />
              <td><GestaoCellCurso titulo={c.titulo} descricao={c.conteudo?.slice(0, 80)} /></td>
              <td><StatusBadge status={c.tipo} /></td>
              <td>{new Date(c.criado_em).toLocaleDateString("pt-BR")}</td>
              <td>
                <GestaoTableActions onEdit={() => setModal({ open: true, item: c })} onDelete={() => setExcluir(c)} />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? "Editar" : "Novo comunicado"}>
        <form className="gestao-form" onSubmit={salvar}>
          <label>Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <label>Conteúdo<textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} rows={4} required /></label>
          <label>Tipo
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal({ open: false, item: null })}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => { await gestaoApi.excluirComunicado(excluir.id); carregar(); }}
        title="Excluir comunicado"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir comunicados selecionados"
        message={`Excluir ${crud.selection.count} comunicado(s) selecionado(s)?`}
        confirmLabel="Excluir selecionados"
        danger
      />
    </div>
  );
}
