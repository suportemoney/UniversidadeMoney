import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoDataTable, { GestaoCellCurso, GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoPagination from "../../components/gestao/GestaoPagination";
import GestaoTableActions from "../../components/gestao/GestaoTableActions";
import GestaoToolbar from "../../components/gestao/GestaoToolbar";
import StatusBadge from "../../components/gestao/StatusBadge";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoBibliotecaPage() {
  const [itens, setItens] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", setor: "", publicado: true });
  const [pdfId, setPdfId] = useState(null);

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
    if (!file || !pdfId) return;
    await gestaoApi.uploadPdfBiblioteca(pdfId, file);
    setPdfId(null);
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

      <GestaoToolbar searchValue={busca} onSearchChange={setBusca} searchPlaceholder="Buscar materiais..." />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum material na biblioteca"
        skeletonCols={5}
        footer={!vazio && !loading ? (
          <GestaoPagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
        ) : null}
      >
        <thead>
          <tr><th>Material</th><th>Setor</th><th>PDF</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {paginados.map((m, i) => (
            <GestaoTableRow key={m.id} index={i}>
              <td><GestaoCellCurso titulo={m.titulo} descricao={m.descricao} /></td>
              <td>{m.setor_nome || "—"}</td>
              <td>
                {m.arquivo_url ? (
                  <a href={m.arquivo_url} target="_blank" rel="noopener noreferrer">Ver PDF</a>
                ) : (
                  <button type="button" className="btn-link" onClick={() => setPdfId(m.id)}>Enviar PDF</button>
                )}
              </td>
              <td><StatusBadge status={m.publicado ? "publicado" : "rascunho"} label={m.publicado ? "Publicado" : "Rascunho"} /></td>
              <td>
                <GestaoTableActions onEdit={() => setModal({ open: true, item: m })} onDelete={() => setExcluir(m)} />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      {pdfId && (
        <label className="btn btn-outline btn-sm gestao-form-card" style={{ marginTop: "1rem", cursor: "pointer" }}>
          Selecionar PDF
          <input type="file" accept="application/pdf" hidden onChange={uploadPdf} />
        </label>
      )}

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
    </div>
  );
}
