import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
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
import { podeExcluir } from "../../utils/niveisAcesso";

const FORM_VAZIO = { nome: "", slug: "", icone: "📁", ordem: 0 };

export default function GestaoSetoresPage() {
  const { user } = useOutletContext() || {};
  const podeApagar = podeExcluir(user);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarSetores().then(setItens).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({
        nome: modal.item.nome,
        slug: modal.item.slug,
        icone: modal.item.icone || "📁",
        ordem: modal.item.ordem ?? 0,
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro("");
  }, [modal]);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(itens, { searchKeys: ["nome", "slug"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((s) => s.id);

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirSetor(id), { sucesso: "setores excluídos" });
    carregar();
  };

  const salvar = async (e) => {
    e.preventDefault();
    setErro("");
    const payload = { ...form, ordem: Number(form.ordem) || 0 };
    try {
      if (modal.item) {
        await gestaoApi.atualizarSetor(modal.item.id, payload);
      } else {
        await gestaoApi.criarSetor(payload);
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
        icon="setores"
        title="Setores"
        subtitle="Setores organizam cursos, trilhas e conteúdos por área da empresa"
      >
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal({ open: true, item: null })}>
          <GestaoIcon name="mais" />
          Novo setor
        </button>
      </GestaoPageHeader>

      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

      <GestaoToolbar
        bulkActions={podeApagar ? (
          <GestaoBulkActions
            count={crud.selection.count}
            actionLabel="Excluir selecionados"
            onAction={() => crud.setLoteOpen(true)}
            onClear={crud.selection.clear}
            loading={crud.loteLoading}
          />
        ) : null}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar setores..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum setor cadastrado"
        skeletonCols={6}
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
            <th>Ícone</th>
            <th>Setor</th>
            <th>Slug</th>
            <th>Ordem</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((s, i) => (
            <GestaoTableRow key={s.id} index={i} selected={crud.selection.isSelected(s.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(s.id)}
                onChange={() => crud.selection.toggle(s.id)}
              />
              <td><span className="gestao-setor-icone" aria-hidden>{s.icone || "📁"}</span></td>
              <td><GestaoCellCurso titulo={s.nome} /></td>
              <td><code>{s.slug}</code></td>
              <td>{s.ordem ?? 0}</td>
              <td>
                <GestaoTableActions onEdit={() => setModal({ open: true, item: s })} onDelete={podeApagar ? () => setExcluir(s) : undefined} />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal.open}
        onClose={fecharModal}
        title={modal.item ? "Editar setor" : "Novo setor"}
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>Cancelar</button>
            <button type="submit" form="form-setor" className="btn btn-primary btn-sm">Salvar</button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-setor" className="gestao-form gestao-form--modal" onSubmit={salvar}>
          <label className="gestao-field">
            Nome
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required placeholder="Ex.: Comercial" />
          </label>
          <label className="gestao-field">
            Slug
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="comercial" />
          </label>
          <label className="gestao-field">
            Ícone (emoji)
            <input value={form.icone} onChange={(e) => setForm({ ...form, icone: e.target.value })} maxLength={8} placeholder="📁" />
          </label>
          <label className="gestao-field">
            Ordem
            <input
              type="number"
              min="0"
              value={form.ordem}
              onChange={(e) => setForm({ ...form, ordem: e.target.value })}
              placeholder="0"
            />
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => { await gestaoApi.excluirSetor(excluir.id); carregar(); }}
        title="Excluir setor"
        message={`Excluir o setor "${excluir?.nome}"? Cursos e conteúdos vinculados ficarão sem setor.`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir setores selecionados"
        message={`Excluir ${crud.selection.count} setor(es) selecionado(s)?`}
        confirmLabel="Excluir selecionados"
        danger
      />
    </div>
  );
}
