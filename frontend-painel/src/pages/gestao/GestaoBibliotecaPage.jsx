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
import StatusBadge from "../../components/gestao/StatusBadge";
import useGestaoCrudTable from "../../hooks/useGestaoCrudTable";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";
import { podeExcluir } from "../../utils/niveisAcesso";

export default function GestaoBibliotecaPage() {
  const { user } = useOutletContext() || {};
  const podeApagar = podeExcluir(user);
  const [itens, setItens] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", setor: "", publicado: true });
  const [pdfModal, setPdfModal] = useState(null);
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarBiblioteca().then(setItens).finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    gestaoApi.setores().then(setSetores);
  }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({
        titulo: modal.item.titulo,
        descricao: modal.item.descricao || "",
        setor: modal.item.setor || "",
        publicado: modal.item.publicado,
      });
    } else {
      setForm({ titulo: "", descricao: "", setor: "", publicado: true });
    }
  }, [modal]);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(itens, { searchKeys: ["titulo"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((m) => m.id);

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirBiblioteca(id), { sucesso: "materiais excluídos" });
    carregar();
  };

  const salvar = async (e) => {
    e.preventDefault();
    const payload = { ...form, setor: form.setor ? Number(form.setor) : null };
    if (modal.item) {
      await gestaoApi.atualizarBiblioteca(modal.item.id, payload);
    } else {
      await gestaoApi.criarBiblioteca(payload);
    }
    setModal({ open: false, item: null });
    carregar();
  };

  const uploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pdfModal) return;
    await gestaoApi.uploadPdfBiblioteca(pdfModal, file);
    setPdfModal(null);
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader icon="biblioteca" title="Biblioteca (PDF)" subtitle="Materiais em PDF para download dos colaboradores">
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal({ open: true, item: null })}>
          <GestaoIcon name="mais" />
          Novo material
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
        searchPlaceholder="Buscar materiais..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum material na biblioteca"
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
            <th>Material</th><th>Setor</th><th>PDF</th><th>Status</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((m, i) => (
            <GestaoTableRow key={m.id} index={i} selected={crud.selection.isSelected(m.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(m.id)}
                onChange={() => crud.selection.toggle(m.id)}
              />
              <td><GestaoCellCurso titulo={m.titulo} descricao={m.descricao} /></td>
              <td>{m.setor_nome || "—"}</td>
              <td>
                {m.arquivo_url ? (
                  <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer">Ver PDF</a>
                ) : (
                  <button type="button" className="btn-link" onClick={() => setPdfModal(m.id)}>Enviar PDF</button>
                )}
              </td>
              <td><StatusBadge status={m.publicado ? "publicado" : "rascunho"} label={m.publicado ? "Publicado" : "Rascunho"} /></td>
              <td>
                <GestaoTableActions onEdit={() => setModal({ open: true, item: m })} onDelete={podeApagar ? () => setExcluir(m) : undefined} />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={!!pdfModal}
        onClose={() => setPdfModal(null)}
        title="Enviar PDF"
        footer={(
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setPdfModal(null)}>Cancelar</button>
        )}
      >
        <p className="gestao-muted" style={{ marginTop: 0 }}>Selecione o arquivo PDF para este material.</p>
        <label className="gestao-field">
          Arquivo PDF
          <input type="file" accept="application/pdf" onChange={uploadPdf} />
        </label>
      </Modal>

      <Modal open={modal.open} onClose={() => setModal({ open: false, item: null })} title={modal.item ? "Editar material" : "Novo material"}>
        <form className="gestao-form" onSubmit={salvar}>
          <label>Título<input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required /></label>
          <label>Descrição<textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></label>
          <label>Setor
            <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
              <option value="">Geral</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </label>
          <label className="gestao-check">
            <input type="checkbox" checked={form.publicado} onChange={(e) => setForm({ ...form, publicado: e.target.checked })} />
            Publicado
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
        onConfirm={async () => { await gestaoApi.excluirBiblioteca(excluir.id); carregar(); }}
        title="Excluir material"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir materiais selecionados"
        message={`Excluir ${crud.selection.count} material(is) selecionado(s)?`}
        confirmLabel="Excluir selecionados"
        danger
      />
    </div>
  );
}
