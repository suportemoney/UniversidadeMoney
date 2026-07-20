import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoBulkActions from "../../components/gestao/GestaoBulkActions";
import GestaoDataTable, { GestaoTableRow } from "../../components/gestao/GestaoDataTable";
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

const FORM_VAZIO = {
  plano: "",
  max_usos: 1,
  tipo_expiracao: "duracao",
  duracao_dias: 90,
  data_fim: "",
  valido_ate_resgate: "",
};

export default function GestaoTokensPage() {
  const [tokens, setTokens] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [usosModal, setUsosModal] = useState(null);
  const [usos, setUsos] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [chaveCriada, setChaveCriada] = useState("");
  const [cancelar, setCancelar] = useState(null);
  const crud = useGestaoCrudTable();

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarTokens().then(setTokens).finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    gestaoApi.listarPlanos().then(setPlanos);
  }, []);

  useEffect(() => {
    if (modal) {
      setForm({ ...FORM_VAZIO, plano: planos[0]?.id || "" });
      setErro("");
      setChaveCriada("");
    }
  }, [modal, planos]);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(tokens, { searchKeys: ["chave", "plano_titulo"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.filter((t) => t.ativo).map((t) => t.id);

  const confirmarLote = async () => {
    await crud.confirmarLote(
      (id) => gestaoApi.atualizarToken(id, { ativo: false }),
      { sucesso: "tokens cancelados" }
    );
    carregar();
  };

  const confirmarCancelar = async () => {
    await gestaoApi.atualizarToken(cancelar.id, { ativo: false });
    setCancelar(null);
    carregar();
  };

  const criar = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      const payload = {
        plano: Number(form.plano),
        max_usos: Number(form.max_usos),
        tipo_expiracao: form.tipo_expiracao,
        duracao_dias: form.tipo_expiracao === "duracao" ? Number(form.duracao_dias) : null,
        data_fim: form.tipo_expiracao === "data_fixa" ? form.data_fim : null,
        valido_ate_resgate: form.valido_ate_resgate || null,
      };
      const token = await gestaoApi.criarToken(payload);
      setChaveCriada(token.chave);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const copiarChave = async (chave) => {
    try {
      await navigator.clipboard.writeText(chave);
    } catch {
      /* ignorar */
    }
  };

  const verUsos = async (token) => {
    const lista = await gestaoApi.listarTokenUsos(token.id);
    setUsos(lista);
    setUsosModal(token);
  };

  const reativar = async (token) => {
    await gestaoApi.atualizarToken(token.id, { ativo: true });
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader icon="tokens" title="Tokens de plano" subtitle="Gere chaves de ativação para novos alunos">
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setModal(true)}>
          <GestaoIcon name="mais" />
          Gerar token
        </button>
      </GestaoPageHeader>

      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

      <GestaoToolbar
        bulkActions={(
          <GestaoBulkActions
            count={crud.selection.count}
            actionLabel="Cancelar selecionados"
            onAction={() => crud.setLoteOpen(true)}
            onClear={crud.selection.clear}
            loading={crud.loteLoading}
          />
        )}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar tokens..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum token gerado"
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
              disabled={!pageIds.length}
            />
            <th>Chave</th>
            <th>Plano</th>
            <th>Usos</th>
            <th>Expiração</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((t, i) => (
            <GestaoTableRow key={t.id} index={i} selected={crud.selection.isSelected(t.id)}>
              <GestaoSelectCell
                checked={crud.selection.isSelected(t.id)}
                onChange={() => crud.selection.toggle(t.id)}
                disabled={!t.ativo}
              />
              <td>
                <code>{t.chave}</code>{" "}
                <button type="button" className="btn-link" onClick={() => copiarChave(t.chave)}>Copiar</button>
              </td>
              <td>{t.plano_titulo}</td>
              <td>{t.usos_realizados} / {t.max_usos}</td>
              <td>
                {t.tipo_expiracao === "data_fixa"
                  ? `Até ${t.data_fim ? new Date(t.data_fim).toLocaleDateString("pt-BR") : "—"}`
                  : `${t.duracao_dias || "—"} dias após resgate`}
              </td>
              <td><StatusBadge status={t.ativo ? "ativo" : "inativo"} /></td>
              <td>
                <div className="gestao-table-actions">
                  <GestaoTableActions
                    onEdit={() => verUsos(t)}
                    editLabel="Usos"
                    onDelete={t.ativo ? () => setCancelar(t) : undefined}
                    deleteLabel="Cancelar"
                  />
                  {!t.ativo && (
                    <button type="button" className="btn-link" onClick={() => reativar(t)}>Ativar</button>
                  )}
                </div>
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Gerar token"
        wide
        footer={chaveCriada ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal(false)}>Fechar</button>
        ) : (
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" form="form-token" className="btn btn-primary btn-sm">Gerar token</button>
          </>
        )}
      >
        {chaveCriada ? (
          <div className="modal-success-block">
            <div className="modal-success-icon" aria-hidden="true">✓</div>
            <p>Token criado com sucesso. Copie e envie ao aluno:</p>
            <code className="modal-token-chave">{chaveCriada}</code>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => copiarChave(chaveCriada)}>Copiar chave</button>
          </div>
        ) : (
          <>
            {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
            <form id="form-token" className="gestao-form gestao-form--modal" onSubmit={criar}>
              <label className="gestao-field">
                Plano
                <select value={form.plano} onChange={(e) => setForm({ ...form, plano: e.target.value })} required>
                  {planos.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
              </label>
              <div className="gestao-form-row gestao-form-row--2">
                <label className="gestao-field">
                  Máximo de usos
                  <input type="number" min={1} value={form.max_usos} onChange={(e) => setForm({ ...form, max_usos: e.target.value })} required />
                </label>
                <label className="gestao-field">
                  Tipo de expiração
                  <select value={form.tipo_expiracao} onChange={(e) => setForm({ ...form, tipo_expiracao: e.target.value })}>
                    <option value="duracao">Duração após resgate</option>
                    <option value="data_fixa">Data fixa de fim</option>
                  </select>
                </label>
              </div>
              {form.tipo_expiracao === "duracao" ? (
                <label className="gestao-field">
                  Duração (dias)
                  <input type="number" min={1} value={form.duracao_dias} onChange={(e) => setForm({ ...form, duracao_dias: e.target.value })} required />
                </label>
              ) : (
                <label className="gestao-field">
                  Data fim do benefício
                  <input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} required />
                </label>
              )}
              <label className="gestao-field">
                Válido para resgate até (opcional)
                <input type="date" value={form.valido_ate_resgate} onChange={(e) => setForm({ ...form, valido_ate_resgate: e.target.value })} />
              </label>
            </form>
          </>
        )}
      </Modal>

      <Modal open={!!usosModal} onClose={() => setUsosModal(null)} title="Usos do token" wide>
        {usosModal && (
          <p className="gestao-muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
            Chave: <code>{usosModal.chave}</code>
          </p>
        )}
        {usos.length === 0 ? (
          <p>Nenhum resgate registrado.</p>
        ) : (
          <table className="gestao-table gestao-table--v2">
            <thead>
              <tr><th>Usuário</th><th>E-mail</th><th>Ativado em</th><th>Expira em</th></tr>
            </thead>
            <tbody>
              {usos.map((u) => (
                <tr key={u.id}>
                  <td>{u.usuario_nome}</td>
                  <td>{u.usuario_email}</td>
                  <td>{new Date(u.ativado_em).toLocaleString("pt-BR")}</td>
                  <td>{new Date(u.expira_em).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelar}
        onClose={() => setCancelar(null)}
        onConfirm={confirmarCancelar}
        title="Cancelar token"
        message={`Cancelar o token "${cancelar?.chave}"? Novos resgates não serão permitidos.`}
        confirmLabel="Cancelar token"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Cancelar tokens selecionados"
        message={`Cancelar ${crud.selection.count} token(s) selecionado(s)? Novos resgates não serão permitidos.`}
        confirmLabel="Cancelar selecionados"
        danger
      />
    </div>
  );
}
