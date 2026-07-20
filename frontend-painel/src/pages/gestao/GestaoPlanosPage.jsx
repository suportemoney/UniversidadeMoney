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

const MODULOS_RESTRITOS = [
  { key: "acesso_cursos", label: "Cursos", icon: "📚" },
  { key: "acesso_trilhas", label: "Trilhas", icon: "🛤️" },
  { key: "acesso_ao_vivo", label: "Ao vivo", icon: "🎥" },
];

const FORM_VAZIO = {
  titulo: "",
  slug: "",
  descricao: "",
  ativo: true,
  acesso_cursos: true,
  acesso_trilhas: false,
  acesso_ao_vivo: false,
  tags_cursos: [],
};

export default function GestaoPlanosPage() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todasTags, setTodasTags] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const crud = useGestaoCrudTable();
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarPlanos().then(setItens).finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    gestaoApi.listarTags().then(setTodasTags);
  }, []);

  useEffect(() => {
    if (modal.item) {
      const tagIds = modal.item.tags_cursos_detalhe
        ? modal.item.tags_cursos_detalhe.map((t) => t.id)
        : (modal.item.tags_cursos || []);
      setForm({ ...FORM_VAZIO, ...modal.item, tags_cursos: tagIds });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro("");
  }, [modal]);

  const toggleTag = (tagId) => {
    setForm((f) => {
      const ids = f.tags_cursos || [];
      return {
        ...f,
        tags_cursos: ids.includes(tagId) ? ids.filter((id) => id !== tagId) : [...ids, tagId],
      };
    });
  };

  const toggleModulo = (key) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  const payloadSalvar = () => ({
    titulo: form.titulo,
    slug: form.slug,
    descricao: form.descricao,
    ativo: form.ativo,
    acesso_cursos: form.acesso_cursos,
    acesso_trilhas: form.acesso_trilhas,
    acesso_ao_vivo: form.acesso_ao_vivo,
    tags_cursos: form.tags_cursos || [],
  });

  const salvar = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      const payload = payloadSalvar();
      if (modal.item) {
        await gestaoApi.atualizarPlano(modal.item.id, payload);
      } else {
        await gestaoApi.criarPlano(payload);
      }
      setModal({ open: false, item: null });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const fecharModal = () => setModal({ open: false, item: null });

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(itens, { searchKeys: ["titulo", "slug"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((p) => p.id);

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirPlano(id), { sucesso: "planos excluídos" });
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader icon="planos" title="Planos" subtitle="Configure planos de acesso e módulos liberados">
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal({ open: true, item: null })}>
          <GestaoIcon name="mais" />
          Novo plano
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
        searchPlaceholder="Buscar planos..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum plano cadastrado"
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
            <th>Plano</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Módulos</th>
            <th>Tags</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((p, i) => (
            <GestaoTableRow key={p.id} index={i} selected={crud.selection.isSelected(p.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(p.id)}
                onChange={() => crud.selection.toggle(p.id)}
              />
              <td><GestaoCellCurso titulo={p.titulo} descricao={p.descricao} /></td>
              <td><code>{p.slug}</code></td>
              <td><StatusBadge status={p.ativo ? "ativo" : "inativo"} /></td>
              <td>
                {MODULOS_RESTRITOS.filter((f) => p[f.key]).map((f) => f.label).join(", ") || "—"}
              </td>
              <td>
                {p.tags_cursos_detalhe?.length
                  ? p.tags_cursos_detalhe.map((t) => t.nome).join(", ")
                  : "Todos"}
              </td>
              <td>
                <GestaoTableActions
                  onEdit={() => setModal({ open: true, item: p })}
                  onDelete={() => setExcluir(p)}
                />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal.open}
        onClose={fecharModal}
        title={modal.item ? "Editar plano" : "Novo plano"}
        wide
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>
              Cancelar
            </button>
            <button type="submit" form="form-plano" className="btn btn-primary btn-sm">
              Salvar plano
            </button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-plano" className="gestao-form gestao-form--modal" onSubmit={salvar}>
          <div className="gestao-form-row gestao-form-row--2">
            <label className="gestao-field">
              Título
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Plano Básico"
                required
              />
            </label>
            <label className="gestao-field">
              Slug
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                placeholder="basico"
              />
            </label>
          </div>

          <label className="gestao-field">
            Descrição
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={3}
              placeholder="Descreva o que este plano oferece..."
            />
          </label>

          <div className="gestao-toggle-row">
            <label className="gestao-checkbox">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Plano ativo e disponível para novos tokens
            </label>
          </div>

          <div className="gestao-form-section">
            <h3 className="gestao-form-section-title">Módulos restritos por plano</h3>
            <p className="gestao-muted" style={{ margin: "0 0 0.75rem" }}>
              Biblioteca, certificados, comunicados e progresso são liberados para todos os planos ativos.
            </p>
            <div className="gestao-features-grid">
              {MODULOS_RESTRITOS.map((f) => (
                <label key={f.key} className="gestao-feature-card">
                  <input
                    type="checkbox"
                    checked={!!form[f.key]}
                    onChange={() => toggleModulo(f.key)}
                  />
                  <span>{f.icon} {f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="gestao-form-section">
            <h3 className="gestao-form-section-title">Filtro por tags (cursos e ao vivo)</h3>
            <p className="gestao-muted" style={{ margin: "0 0 0.75rem" }}>
              Nenhuma tag selecionada = todos os cursos e treinamentos ao vivo. Com tags = apenas itens que possuem pelo menos uma tag em comum.
            </p>
            {todasTags.length === 0 ? (
              <p className="gestao-muted">Cadastre tags em Gestão → Tags antes de restringir conteúdo.</p>
            ) : (
              <div className="gestao-features-grid">
                {todasTags.filter((t) => t.ativo).map((t) => (
                  <label key={t.id} className="gestao-feature-card">
                    <input
                      type="checkbox"
                      checked={(form.tags_cursos || []).includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                    />
                    <span>{t.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => {
          await gestaoApi.excluirPlano(excluir.id);
          carregar();
        }}
        title="Excluir plano"
        message={`Excluir o plano "${excluir?.titulo}"? Tokens vinculados podem deixar de funcionar.`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir planos selecionados"
        message={`Excluir ${crud.selection.count} plano(s) selecionado(s)? Tokens vinculados podem deixar de funcionar.`}
        confirmLabel="Excluir selecionados"
        danger
      />
    </div>
  );
}
