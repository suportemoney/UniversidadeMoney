import { Fragment, useEffect, useMemo, useState } from "react";
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
import CursoExpandPanel from "../../components/gestao/curso/CursoExpandPanel";
import useGestaoCrudTable from "../../hooks/useGestaoCrudTable";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";
import { podeExcluir } from "../../utils/niveisAcesso";

const STATUS = [
  { value: "", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "publicado", label: "Publicado" },
  { value: "arquivado", label: "Arquivado" },
];

const FORM_VAZIO = { titulo: "", descricao: "", setor: "" };
const PAGE_SIZE = 8;

export default function GestaoCursosPage() {
  const { user } = useOutletContext() || {};
  const podeApagar = podeExcluir(user);
  const [cursos, setCursos] = useState([]);
  const [setores, setSetores] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [editForm, setEditForm] = useState({ titulo: "", setor: "", instrutor: "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluir, setExcluir] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarCursos(filtro || undefined)
      .then(setCursos)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, [filtro]);

  useEffect(() => {
    if (modal) {
      setForm(FORM_VAZIO);
      setErro("");
      gestaoApi.setores().then(setSetores);
    }
  }, [modal]);

  useEffect(() => {
    if (editModal) {
      setEditForm({
        titulo: editModal.titulo || "",
        setor: editModal.setor || "",
        instrutor: editModal.instrutor || "",
      });
      setErro("");
      gestaoApi.setores().then(setSetores);
      gestaoApi.usuarios().then((lista) => setUsuarios(Array.isArray(lista) ? lista : lista?.results || []));
    }
  }, [editModal]);

  const {
    busca,
    setBusca,
    page,
    setPage,
    paginados,
    totalPages,
    totalItems,
    pageSize,
  } = usePaginatedList(cursos, { searchKeys: ["titulo", "descricao"], pageSize: PAGE_SIZE });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((c) => c.id);

  const abrirModal = () => setModal(true);
  const fecharModal = () => setModal(false);

  const confirmarLote = async () => {
    await crud.confirmarLote(
      (id) => (podeApagar ? gestaoApi.excluirCurso(id) : gestaoApi.arquivarCurso(id)),
      { sucesso: podeApagar ? "cursos excluídos" : "cursos inativados" }
    );
    carregar();
  };

  const criar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const criado = await gestaoApi.criarCurso({
        titulo: form.titulo,
        descricao: form.descricao,
        setor: form.setor || null,
      });
      fecharModal();
      await carregar();
      setExpandido(criado.id);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const salvarEdicao = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      await gestaoApi.atualizarCurso(editModal.id, {
        titulo: editForm.titulo,
        setor: editForm.setor || null,
        instrutor: editForm.instrutor || null,
      });
      setEditModal(null);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const inativar = async (curso) => {
    await gestaoApi.arquivarCurso(curso.id);
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader
        icon="cursos"
        title="Cursos"
        subtitle="Estrutura: descrição → material → módulos (vídeos + atividade) → prova final"
      >
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={abrirModal}>
          <GestaoIcon name="mais" />
          Novo curso
        </button>
      </GestaoPageHeader>

      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

      <GestaoToolbar
        bulkActions={(
          <GestaoBulkActions
            count={crud.selection.count}
            actionLabel={podeApagar ? "Excluir selecionados" : "Inativar selecionados"}
            onAction={() => crud.setLoteOpen(true)}
            onClear={crud.selection.clear}
            loading={crud.loteLoading}
          />
        )}
        filterOptions={STATUS}
        filterValue={filtro}
        onFilterChange={(v) => { setFiltro(v); setPage(1); }}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar cursos..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum curso encontrado"
        emptyMessage="Crie um novo curso ou ajuste os filtros de busca."
        emptyAction={(
          <button type="button" className="btn btn-primary btn-sm" onClick={abrirModal}>
            Criar primeiro curso
          </button>
        )}
        skeletonCols={6}
        footer={!vazio && !loading ? (
          <GestaoPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
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
            <th>Curso</th>
            <th>Status</th>
            <th>Setor</th>
            <th>Módulos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((c, i) => (
            <Fragment key={c.id}>
              <GestaoTableRow
                index={i}
                selected={crud.selection.isSelected(c.id)}
                className={expandido === c.id ? "is-expanded" : ""}
                onClick={() => setExpandido(expandido === c.id ? null : c.id)}
              >
                <GestaoSelectCell
                  checked={crud.selection.isSelected(c.id)}
                  onChange={() => crud.selection.toggle(c.id)}
                />
                <td>
                  <GestaoCellCurso
                    titulo={c.titulo}
                    descricao={c.descricao || "Clique para editar conteúdo"}
                  />
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td>{c.setor_nome || "—"}</td>
                <td>{c.total_modulos}</td>
                <td>
                  <GestaoTableActions
                    onEdit={async () => {
                      const detalhe = await gestaoApi.obterCurso(c.id);
                      setEditModal(detalhe);
                    }}
                    onInativar={c.status !== "arquivado" ? () => inativar(c) : undefined}
                    onDelete={podeApagar ? () => setExcluir(c) : undefined}
                  />
                </td>
              </GestaoTableRow>
              {expandido === c.id && (
                <tr className="curso-expand-row">
                  <td colSpan={6}>
                    <CursoExpandPanel cursoId={c.id} onChanged={carregar} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal}
        onClose={fecharModal}
        title="Novo curso"
        wide
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>Cancelar</button>
            <button type="submit" form="form-curso" className="btn btn-primary btn-sm" disabled={salvando}>
              {salvando ? "Criando..." : "Criar curso"}
            </button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-curso" className="gestao-form gestao-form--modal" onSubmit={criar}>
          <label className="gestao-field">
            Título
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
              autoFocus
            />
          </label>
          <label className="gestao-field">
            Descrição
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={4}
            />
          </label>
          <label className="gestao-field">
            Setor
            <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
              <option value="">Selecione...</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </label>
        </form>
      </Modal>

      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Editar curso"
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditModal(null)}>Cancelar</button>
            <button type="submit" form="form-curso-edit" className="btn btn-primary btn-sm" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-curso-edit" className="gestao-form gestao-form--modal" onSubmit={salvarEdicao}>
          <label className="gestao-field">
            Título
            <input
              value={editForm.titulo}
              onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
              required
            />
          </label>
          <label className="gestao-field">
            Setor
            <select value={editForm.setor || ""} onChange={(e) => setEditForm({ ...editForm, setor: e.target.value })}>
              <option value="">Selecione...</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </label>
          <label className="gestao-field">
            Instrutor
            <select
              value={editForm.instrutor || ""}
              onChange={(e) => setEditForm({ ...editForm, instrutor: e.target.value })}
            >
              <option value="">Selecione...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name || u.username} ({u.username})
                </option>
              ))}
            </select>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => {
          await gestaoApi.excluirCurso(excluir.id);
          if (expandido === excluir.id) setExpandido(null);
          carregar();
        }}
        title="Excluir curso"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title={podeApagar ? "Excluir cursos selecionados" : "Inativar cursos selecionados"}
        message={
          podeApagar
            ? `Excluir ${crud.selection.count} curso(s) selecionado(s)? Esta ação não pode ser desfeita.`
            : `Arquivar ${crud.selection.count} curso(s) selecionado(s)?`
        }
        confirmLabel={podeApagar ? "Excluir selecionados" : "Inativar selecionados"}
        danger
      />
    </div>
  );
}
