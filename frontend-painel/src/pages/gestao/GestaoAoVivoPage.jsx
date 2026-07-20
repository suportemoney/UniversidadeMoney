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

const FORM_VAZIO = {
  titulo: "", data: "", hora: "", setor: "", descricao: "", tipo_plataforma: "meet", link: "", tag_ids: [],
};

export default function GestaoAoVivoPage() {
  const [itens, setItens] = useState([]);
  const [setores, setSetores] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarAoVivo().then(setItens).finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    gestaoApi.setores().then(setSetores);
    gestaoApi.listarTags().then(setTags);
  }, []);

  useEffect(() => {
    if (modal.item) {
      const tagIds = (modal.item.tags || []).map((t) => (typeof t === "object" ? t.id : t));
      setForm({
        titulo: modal.item.titulo,
        data: modal.item.data,
        hora: modal.item.hora?.slice(0, 5) || modal.item.hora,
        setor: modal.item.setor || "",
        descricao: modal.item.descricao || "",
        tipo_plataforma: modal.item.tipo_plataforma || "meet",
        link: modal.item.link || "",
        tag_ids: tagIds,
      });
    } else {
      setForm(FORM_VAZIO);
    }
  }, [modal]);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(itens, { searchKeys: ["titulo"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((t) => t.id);

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirAoVivo(id), { sucesso: "treinamentos excluídos" });
    carregar();
  };

  const salvar = async (e) => {
    e.preventDefault();
    const payload = {
      titulo: form.titulo,
      data: form.data,
      hora: form.hora,
      descricao: form.descricao,
      setor: form.setor ? Number(form.setor) : null,
      tipo_plataforma: form.tipo_plataforma,
      link: form.link.trim(),
      tag_ids: form.tag_ids,
    };
    if (modal.item) {
      await gestaoApi.atualizarAoVivo(modal.item.id, payload);
    } else {
      await gestaoApi.criarAoVivo(payload);
    }
    setModal({ open: false, item: null });
    carregar();
  };

  const labelPlataforma = (tipo) => (tipo === "youtube" ? "YouTube" : "Meet");

  return (
    <div>
      <GestaoPageHeader
        icon="aoVivo"
        title="Treinamentos ao vivo"
        subtitle="Links externos — Google Meet ou transmissão no YouTube"
      >
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal({ open: true, item: null })}>
          <GestaoIcon name="mais" />
          Novo treinamento
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
        searchPlaceholder="Buscar treinamentos..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum treinamento ao vivo"
        skeletonCols={7}
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
            <th>Treinamento</th><th>Data</th><th>Hora</th><th>Plataforma</th><th>Setor</th><th>Ações</th>
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
                <GestaoCellCurso
                  titulo={t.titulo}
                  descricao={t.tags?.map((tag) => tag.nome).join(", ") || "Sem tags"}
                />
              </td>
              <td>{new Date(t.data).toLocaleDateString("pt-BR")}</td>
              <td>{t.hora?.slice?.(0, 5) || t.hora}</td>
              <td>{labelPlataforma(t.tipo_plataforma)}</td>
              <td>{t.setor_nome || "—"}</td>
              <td>
                <GestaoTableActions onEdit={() => setModal({ open: true, item: t })} onDelete={() => setExcluir(t)} />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? "Editar" : "Novo treinamento"} wide>
        <form className="gestao-form gestao-form--modal" onSubmit={salvar}>
          <label className="gestao-field">Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <div className="gestao-form-row gestao-form-row--2">
            <label className="gestao-field">Data<input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required /></label>
            <label className="gestao-field">Hora<input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} required /></label>
          </div>
          <div className="gestao-form-row gestao-form-row--2">
            <label className="gestao-field">Plataforma
              <select value={form.tipo_plataforma} onChange={(e) => setForm({ ...form, tipo_plataforma: e.target.value })}>
                <option value="meet">Google Meet</option>
                <option value="youtube">YouTube Live</option>
              </select>
            </label>
            <label className="gestao-field">Setor
              <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
                <option value="">Geral</option>
                {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </label>
          </div>
          <label className="gestao-field">
            Link da transmissão
            <input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} required />
          </label>
          <label className="gestao-field">Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></label>
          <div className="gestao-form-section">
            <h3 className="gestao-form-section-title">Tags</h3>
            {tags.length === 0 ? (
              <p className="gestao-muted">Nenhuma tag cadastrada.</p>
            ) : (
              <div className="gestao-features-grid">
                {tags.filter((t) => t.ativo).map((t) => (
                  <label key={t.id} className="gestao-feature-card">
                    <input
                      type="checkbox"
                      checked={form.tag_ids.includes(t.id)}
                      onChange={() => {
                        const ids = form.tag_ids.includes(t.id)
                          ? form.tag_ids.filter((id) => id !== t.id)
                          : [...form.tag_ids, t.id];
                        setForm({ ...form, tag_ids: ids });
                      }}
                    />
                    <span>{t.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal({ open: false, item: null })}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => { await gestaoApi.excluirAoVivo(excluir.id); carregar(); }}
        title="Excluir treinamento"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir treinamentos selecionados"
        message={`Excluir ${crud.selection.count} treinamento(s) selecionado(s)?`}
        confirmLabel="Excluir selecionados"
        danger
      />
    </div>
  );
}
