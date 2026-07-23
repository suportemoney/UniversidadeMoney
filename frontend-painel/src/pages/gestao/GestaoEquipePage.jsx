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
import { formatarCpf } from "../../utils/cpf";
import { NIVEL_LABELS, NIVEIS_EQUIPE, ehNivelEquipe } from "../../utils/niveisAcesso";

const FORM_CRIAR_VAZIO = {
  nome: "",
  email: "",
  cpf: "",
  cargo: "",
  password: "",
  nivel_acesso: "gestor",
  setor: "",
};

function podeSelecionar(u) {
  return !u.is_superuser;
}

export default function GestaoEquipePage() {
  const [usuarios, setUsuarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, item: null });
  const [visualizar, setVisualizar] = useState(null);
  const [form, setForm] = useState(FORM_CRIAR_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [inativar, setInativar] = useState(null);
  const [excluir, setExcluir] = useState(null);
  const crud = useGestaoCrudTable();

  const carregar = (termo = "") => {
    setLoading(true);
    return gestaoApi.usuarios(termo)
      .then((lista) => setUsuarios((Array.isArray(lista) ? lista : []).filter(ehNivelEquipe)))
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    gestaoApi.setores().then(setSetores);
  }, []);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(usuarios, { searchKeys: ["first_name", "email", "cargo", "nivel_acesso"], pageSize: 10 });

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
        cargo: modal.item.cargo || "",
        password: "",
        nivel_acesso: modal.item.nivel_acesso || "gestor",
        setor: modal.item.setor || "",
      });
    } else {
      setForm(FORM_CRIAR_VAZIO);
    }
  }, [modal]);

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.filter(podeSelecionar).map((u) => u.id);

  const fecharModal = () => setModal({ open: false, item: null });

  const abrirEdicao = (item) => {
    setVisualizar(null);
    setModal({ open: true, item });
  };

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
        const payload = {
          first_name: form.nome,
          email: form.email,
          cpf: form.cpf,
          cargo: form.cargo,
          nivel_acesso: form.nivel_acesso,
          setor: form.setor ? Number(form.setor) : null,
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await gestaoApi.atualizarUsuarioEquipe(modal.item.id, payload);
      } else {
        await gestaoApi.criarUsuarioEquipe({
          nome: form.nome,
          email: form.email,
          cpf: form.cpf,
          password: form.password,
          nivel_acesso: form.nivel_acesso,
          setor: form.setor ? Number(form.setor) : null,
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

  const confirmarExcluir = async () => {
    try {
      await gestaoApi.excluirUsuarioEquipePermanente(excluir.id);
      setExcluir(null);
      carregar();
    } catch (err) {
      setErro(err.message || "Não foi possível excluir o colaborador.");
      setExcluir(null);
    }
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
            <th>Nível</th>
            <th className="gestao-th-acoes">Ações</th>
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
              <td>
                <StatusBadge
                  status={u.nivel_acesso === "administrador" || u.is_superuser ? "ativo" : "info"}
                  label={NIVEL_LABELS[u.nivel_acesso] || u.cargo || "—"}
                />
              </td>
              <td className="gestao-td-acoes">
                <GestaoTableActions
                  center
                  onView={() => setVisualizar(u)}
                  onEdit={() => abrirEdicao(u)}
                  onInativar={!u.is_superuser ? () => setInativar(u) : undefined}
                  onDelete={!u.is_superuser ? () => setExcluir(u) : undefined}
                  viewLabel="Visualizar"
                  editLabel="Editar"
                  inativarLabel="Inativar"
                  deleteLabel="Excluir permanente"
                />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={!!visualizar}
        onClose={() => setVisualizar(null)}
        title="Perfil do membro"
        wide
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setVisualizar(null)}>
              Fechar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => abrirEdicao(visualizar)}
            >
              <GestaoIcon name="editar" />
              Editar
            </button>
          </>
        )}
      >
        {visualizar && (
          <dl className="convites-perfil-dl">
            <div><dt>Nome</dt><dd>{visualizar.first_name || "—"}</dd></div>
            <div><dt>E-mail</dt><dd>{visualizar.email || "—"}</dd></div>
            <div><dt>CPF</dt><dd>{visualizar.cpf ? formatarCpf(visualizar.cpf) : "—"}</dd></div>
            <div>
              <dt>Nível de acesso</dt>
              <dd>{NIVEL_LABELS[visualizar.nivel_acesso] || visualizar.nivel_acesso || "—"}</dd>
            </div>
            <div><dt>Cargo</dt><dd>{visualizar.cargo || "—"}</dd></div>
            <div><dt>Setor</dt><dd>{visualizar.setor_nome || "Geral"}</dd></div>
            <div><dt>Membro da equipe</dt><dd>{visualizar.is_membro_equipe ? "Sim" : "Não"}</dd></div>
            <div><dt>Administrador</dt><dd>{visualizar.is_superuser ? "Sim" : "Não"}</dd></div>
          </dl>
        )}
      </Modal>

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
              required={!modal.item}
              placeholder="000.000.000-00"
            />
          </label>
          {modal.item && (
            <label className="gestao-field">
              Cargo
              <input
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Ex.: Analista de TI"
              />
            </label>
          )}
          <label className="gestao-field">
            {modal.item ? "Nova senha (opcional)" : "Senha inicial"}
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!modal.item}
              minLength={modal.item && !form.password ? undefined : 8}
              placeholder={modal.item ? "Deixe em branco para manter" : ""}
            />
          </label>
          <label className="gestao-field">
            Nível de acesso
            <select
              value={form.nivel_acesso}
              onChange={(e) => setForm({ ...form, nivel_acesso: e.target.value })}
              required
              disabled={Boolean(modal.item?.is_superuser)}
            >
              {NIVEIS_EQUIPE.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
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
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={confirmarExcluir}
        title="Excluir permanentemente"
        message={`Excluir permanentemente "${excluir?.first_name || excluir?.email}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir permanente"
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
