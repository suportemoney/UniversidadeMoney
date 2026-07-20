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

const FORM_VAZIO = { nome: "", slug: "", ativo: true };

export default function GestaoTagsPage() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarTags().then(setItens).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({ nome: modal.item.nome, slug: modal.item.slug, ativo: modal.item.ativo });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro("");
  }, [modal]);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(itens, { searchKeys: ["nome", "slug"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((t) => t.id);

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirTag(id), { sucesso: "tags excluídas" });
    carregar();
  };

  const salvar = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      if (modal.item) {
        await gestaoApi.atualizarTag(modal.item.id, form);
      } else {
        await gestaoApi.criarTag(form);
      }
      setModal({ open: false, item: null });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const fecharModal = () => setModal({ open: false, item: null });

  return (
    <div>
      <GestaoPageHeader
        icon="tags"
        title="Tags de curso"
        subtitle="Tags categorizam cursos e definem quais conteúdos cada plano pode exibir"
      >
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal({ open: true, item: null })}>
          <GestaoIcon name="mais" />
          Nova tag
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
        searchPlaceholder="Buscar tags..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhuma tag cadastrada"
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
            <th>Tag</th><th>Slug</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((t, i) => (
            <GestaoTableRow key={t.id} index={i} selected={crud.selection.isSelected(t.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(t.id)}
                onChange={() => crud.selection.toggle(t.id)}
              />
              <td><GestaoCellCurso titulo={t.nome} /></td>
              <td><code>{t.slug}</code></td>
              <td><StatusBadge status={t.ativo ? "ativo" : "inativo"} /></td>
              <td>
                <GestaoTableActions onEdit={() => setModal({ open: true, item: t })} onDelete={() => setExcluir(t)} />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal.open}
        onClose={fecharModal}
        title={modal.item ? "Editar tag" : "Nova tag"}
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>Cancelar</button>
            <button type="submit" form="form-tag" className="btn btn-primary btn-sm">Salvar</button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-tag" className="gestao-form gestao-form--modal" onSubmit={salvar}>
          <label className="gestao-field">
            Nome
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex.: Vendas" />
          </label>
          <label className="gestao-field">
            Slug
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="vendas" />
          </label>
          <label className="gestao-checkbox">
            <input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            Tag ativa
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => { await gestaoApi.excluirTag(excluir.id); carregar(); }}
        title="Excluir tag"
        message={`Excluir a tag "${excluir?.nome}"?`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir tags selecionadas"
        message={`Excluir ${crud.selection.count} tag(s) selecionada(s)?`}
        confirmLabel="Excluir selecionadas"
        danger
      />
    </div>
  );
}
