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

const FORM_CRIAR_VAZIO = {
  nome: "",
  email: "",
  cpf: "",
  password: "",
  cargo: "Colaborador",
  setor: "",
  is_membro_equipe: true,
};

function podeSelecionar(u) {
  return !u.is_superuser;
}

export default function GestaoEquipePage() {
  const [usuarios, setUsuarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState(FORM_CRIAR_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [inativar, setInativar] = useState(null);
  const crud = useGestaoCrudTable();

  const carregar = (termo = "") => {
    setLoading(true);
    return gestaoApi.usuarios(termo)
      .then(setUsuarios)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    gestaoApi.setores().then(setSetores);
  }, []);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(usuarios, { searchKeys: ["first_name", "email", "cargo"], pageSize: 10 });

  useEffect(() => {
    const timer = setTimeout(() => carregar(busca), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (!modal.open) return;
    setErro("");
    if (modal.item) {
      setForm({
        nome: modal.item.first_name || "",
        email: modal.item.email || "",
        cpf: modal.item.cpf || "",
        password: "",
        cargo: modal.item.cargo || "Colaborador",
        setor: modal.item.setor || "",
        is_membro_equipe: !!modal.item.is_membro_equipe,
      });
    } else {
      setForm(FORM_CRIAR_VAZIO);
    }
  }, [modal]);

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.filter(podeSelecionar).map((u) => u.id);

  const fecharModal = () => setModal({ open: false, item: null });

  const confirmarLote = async () => {
    await crud.confirmarLote(
      (id) => gestaoApi.inativarUsuarioEquipe(id),
      { sucesso: "colaboradores inativados" }
    );
    carregar();
  };

  const salvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      if (modal.item) {
        await gestaoApi.atualizarUsuarioEquipe(modal.item.id, {
          first_name: form.nome,
          cargo: form.cargo,
          setor: form.setor ? Number(form.setor) : null,
          is_membro_equipe: form.is_membro_equipe,
        });
      } else {
        await gestaoApi.criarUsuarioEquipe({
          nome: form.nome,
          email: form.email,
          cpf: form.cpf,
          password: form.password,
          cargo: form.cargo,
          setor: form.setor ? Number(form.setor) : null,
          is_membro_equipe: form.is_membro_equipe,
        });
      }
      fecharModal();
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarInativar = async () => {
    await gestaoApi.inativarUsuarioEquipe(inativar.id);
    setInativar(null);
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader
        icon="equipe"
        title="Equipe de gestão"
        subtitle="Gerencie colaboradores com acesso à área de gestão de conteúdo"
      >
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal({ open: true, item: null })}>
          <GestaoIcon name="mais" />
          Novo membro
        </button>
      </GestaoPageHeader>

      {erro && !modal.open && <div className="modal-alert modal-alert--error">{erro}</div>}
      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

      <GestaoToolbar
        bulkActions={(
          <GestaoBulkActions
            count={crud.selection.count}
            actionLabel="Inativar selecionados"
            onAction={() => crud.setLoteOpen(true)}
            onClear={crud.selection.clear}
            loading={crud.loteLoading}
          />
        )}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar por nome ou e-mail..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum colaborador encontrado"
        emptyMessage="Cadastre um novo membro ou ajuste a busca."
        emptyAction={(
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal({ open: true, item: null })}>
            Novo membro
          </button>
        )}
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
              disabled={!pageIds.length}
            />
            <th>Colaborador</th>
            <th>E-mail</th>
            <th>Cargo</th>
            <th>Equipe</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((u, i) => (
            <GestaoTableRow key={u.id} index={i} selected={crud.selection.isSelected(u.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(u.id)}
                onChange={() => crud.selection.toggle(u.id)}
                disabled={!podeSelecionar(u)}
              />
              <td><GestaoCellCurso titulo={u.first_name || u.email} descricao={u.setor_nome || undefined} /></td>
              <td>{u.email}</td>
              <td>{u.cargo || "—"}</td>
              <td>
                {u.is_superuser ? (
                  <span className="gestao-badge">Superuser</span>
                ) : (
                  <StatusBadge status={u.is_membro_equipe ? "ativo" : "inativo"} label={u.is_membro_equipe ? "Membro" : "Sem acesso"} />
                )}
              </td>
              <td>
                {!u.is_superuser && (
                  <GestaoTableActions
                    onEdit={() => setModal({ open: true, item: u })}
                    onDelete={() => setInativar(u)}
                    deleteLabel="Inativar"
                  />
                )}
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal.open}
        onClose={fecharModal}
        title={modal.item ? "Editar membro" : "Novo membro"}
        wide
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>Cancelar</button>
            <button type="submit" form="form-equipe" className="btn btn-primary btn-sm" disabled={salvando}>
              {salvando ? "Salvando..." : modal.item ? "Salvar" : "Criar membro"}
            </button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-equipe" className="gestao-form gestao-form--modal" onSubmit={salvar}>
          <label className="gestao-field">
            Nome
            <input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
              autoFocus
            />
          </label>
          {!modal.item && (
            <>
              <label className="gestao-field">
                E-mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label className="gestao-field">
                CPF
                <input
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  required
                  placeholder="000.000.000-00"
                />
              </label>
              <label className="gestao-field">
                Senha inicial
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </label>
            </>
          )}
          <label className="gestao-field">
            Cargo
            <input
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            />
          </label>
          <label className="gestao-field">
            Setor
            <select value={form.setor} onChange={(e) => setForm({ ...form, setor: e.target.value })}>
              <option value="">Geral</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </label>
          <label className="gestao-checkbox">
            <input
              type="checkbox"
              checked={form.is_membro_equipe}
              onChange={(e) => setForm({ ...form, is_membro_equipe: e.target.checked })}
            />
            Membro da equipe de gestão (pode criar e editar conteúdo)
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!inativar}
        onClose={() => setInativar(null)}
        onConfirm={confirmarInativar}
        title="Inativar colaborador"
        message={`Inativar "${inativar?.first_name || inativar?.email}"? A conta deixará de acessar a plataforma.`}
        confirmLabel="Inativar"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Inativar colaboradores selecionados"
        message={`Inativar ${crud.selection.count} colaborador(es) selecionado(s)?`}
        confirmLabel="Inativar selecionados"
        danger
      />
    </div>
  );
}
