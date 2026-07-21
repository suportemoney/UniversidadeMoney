import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoBulkActions from "../../components/gestao/GestaoBulkActions";
import GestaoDataTable, { GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoPagination from "../../components/gestao/GestaoPagination";
import { GestaoSelectCell, GestaoSelectHeaderCell } from "../../components/gestao/GestaoTableCheckbox";
import GestaoToolbar from "../../components/gestao/GestaoToolbar";
import StatusBadge from "../../components/gestao/StatusBadge";
import useGestaoCrudTable from "../../hooks/useGestaoCrudTable";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";
import { NIVEL_LABELS, niveisDisponiveisParaConvite } from "../../utils/niveisAcesso";
import { formatarCpf } from "../../utils/cpf";

const FORM_VAZIO = {
  username: "",
  first_name: "",
  email: "",
  cpf: "",
  nivel_acesso: "padrao",
};

const FILTROS = [
  { value: "", label: "Todos" },
  { value: "valido", label: "Válidos" },
  { value: "usado", label: "Usados" },
  { value: "invalido", label: "Revogados" },
];

const PAGE_SIZE = 8;
const INTERNO_URL = import.meta.env.VITE_INTERNO_URL || "http://localhost:5175";

function statusConvite(row) {
  if (!row.id && !row.chave) return { key: "rascunho", label: "Sem token" };
  if (row.usado_em) return { key: "info", label: "Usado" };
  if (row.valido) return { key: "ativo", label: "Válido" };
  return { key: "inativo", label: "Revogado" };
}

function mascaraToken(chave) {
  if (!chave || chave.length < 12) return chave || "—";
  return `${chave.slice(0, 8)}…${chave.slice(-4)}`;
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export default function GestaoConvitesPage() {
  const { user } = useOutletContext() || {};
  const niveisOpcoes = niveisDisponiveisParaConvite(user);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [revogar, setRevogar] = useState(null);
  const [redefinir, setRedefinir] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [perfilLoading, setPerfilLoading] = useState(false);
  const [tokenCriado, setTokenCriado] = useState(null);
  const [copiado, setCopiado] = useState("");
  const crud = useGestaoCrudTable();

  const carregar = useCallback(() => {
    setLoading(true);
    return gestaoApi
      .listarConvites()
      .then((data) => setItens(Array.isArray(data) ? data : []))
      .catch((err) => setErro(err.message || "Falha ao carregar convites."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    if (!filtro) return itens;
    return itens.filter((row) => {
      const st = statusConvite(row).label.toLowerCase();
      if (filtro === "valido") return st === "válido";
      if (filtro === "usado") return st === "usado";
      if (filtro === "invalido") return st === "revogado";
      return true;
    });
  }, [itens, filtro]);

  const {
    busca,
    setBusca,
    page,
    setPage,
    paginados,
    totalPages,
    totalItems,
    pageSize,
  } = usePaginatedList(filtrados, {
    searchKeys: ["username", "first_name", "chave", "criado_por"],
    pageSize: PAGE_SIZE,
  });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);
  const pageIds = paginados.map((r) => r.id);
  const idsRevogaveis = useMemo(
    () => paginados.filter((r) => r.valido).map((r) => r.id),
    [paginados]
  );

  const abrirModal = () => {
    setForm(FORM_VAZIO);
    setErro("");
    setModal(true);
  };

  const fecharModal = () => {
    setModal(false);
    setErro("");
  };

  const criar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const data = await gestaoApi.criarConvite(form);
      fecharModal();
      setTokenCriado(data);
      setCopiado("");
      await carregar();
    } catch (err) {
      setErro(err.message || "Não foi possível criar o convite.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRevogar = async () => {
    await gestaoApi.revogarConvite(revogar.id);
    setRevogar(null);
    carregar();
  };

  const confirmarRedefinir = async () => {
    await gestaoApi.redefinirSenhaConvite(redefinir.usuario_id);
    setRedefinir(null);
    carregar();
  };

  const abrirPerfil = async (row) => {
    if (!row?.usuario_id) return;
    setPerfilLoading(true);
    setErro("");
    try {
      const data = await gestaoApi.obterPerfilConvite(row.usuario_id);
      setPerfil({
        ...data,
        // Dados do token da linha (contexto do convite)
        token_chave: row.chave,
        token_status: statusConvite(row).label,
        token_criado_em: row.criado_em,
        token_criado_por: row.criado_por,
      });
    } catch (err) {
      setErro(err.message || "Não foi possível carregar o perfil.");
    } finally {
      setPerfilLoading(false);
    }
  };

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.revogarConvite(id), {
      sucesso: "convites revogados",
    });
    carregar();
  };

  const handleCopiar = async (texto, key) => {
    const ok = await copiarTexto(texto);
    if (ok) {
      setCopiado(key);
      setTimeout(() => setCopiado(""), 2000);
    }
  };

  const resumo = useMemo(() => {
    const validos = itens.filter((r) => r.valido).length;
    const usados = itens.filter((r) => r.usado_em).length;
    return { total: itens.length, validos, usados };
  }, [itens]);

  return (
    <div>
      <GestaoPageHeader
        icon="tokens"
        title="Convites"
        subtitle="Gere token-key para colaboradores ativarem o primeiro acesso no ambiente interno."
      >
        <button type="button" className="btn btn-primary gestao-btn-cta" onClick={abrirModal}>
          <GestaoIcon name="mais" />
          Novo convite
        </button>
      </GestaoPageHeader>

      <div className="convites-resumo">
        <div className="convites-resumo-card">
          <span className="convites-resumo-valor">{resumo.total}</span>
          <span className="convites-resumo-label">Total</span>
        </div>
        <div className="convites-resumo-card convites-resumo-card--ok">
          <span className="convites-resumo-valor">{resumo.validos}</span>
          <span className="convites-resumo-label">Válidos</span>
        </div>
        <div className="convites-resumo-card">
          <span className="convites-resumo-valor">{resumo.usados}</span>
          <span className="convites-resumo-label">Já usados</span>
        </div>
      </div>

      {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}
      {erro && !modal && <div className="alert alert-error">{erro}</div>}

      <GestaoToolbar
        bulkActions={(
          <GestaoBulkActions
            count={crud.selection.count}
            actionLabel="Revogar selecionados"
            onAction={() => crud.setLoteOpen(true)}
            onClear={crud.selection.clear}
            loading={crud.loteLoading}
          />
        )}
        filterOptions={FILTROS}
        filterValue={filtro}
        onFilterChange={(v) => {
          setFiltro(v);
          setPage(1);
        }}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar por usuário, nome ou token..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum convite encontrado"
        emptyMessage="Crie um colaborador e envie o token-key para o primeiro acesso em interno."
        emptyAction={(
          <button type="button" className="btn btn-primary btn-sm" onClick={abrirModal}>
            Criar primeiro convite
          </button>
        )}
        skeletonCols={8}
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
              checked={crud.selection.isAllSelected(idsRevogaveis)}
              indeterminate={crud.selection.isIndeterminate(idsRevogaveis)}
              onChange={() => crud.selection.toggleAll(idsRevogaveis)}
              disabled={!idsRevogaveis.length}
            />
            <th>Colaborador</th>
            <th>Nível</th>
            <th>Token</th>
            <th>Status</th>
            <th>Criado por</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((row, i) => {
            const st = statusConvite(row);
            const rowKey = row.id ?? `user-${row.usuario_id}`;
            return (
              <GestaoTableRow
                key={rowKey}
                index={i}
                selected={row.id ? crud.selection.isSelected(row.id) : false}
              >
                <GestaoSelectCell
                  checked={row.id ? crud.selection.isSelected(row.id) : false}
                  onChange={() => row.id && crud.selection.toggle(row.id)}
                  disabled={!row.valido}
                />
                <td>
                  <div className="convites-user-cell">
                    <strong>{row.first_name || row.username}</strong>
                    <span className="gestao-muted">@{row.username}</span>
                  </div>
                </td>
                <td>{NIVEL_LABELS[row.nivel_acesso] || row.nivel_acesso || "—"}</td>
                <td>
                  <div className="convites-token-cell">
                    <code title={row.chave || ""}>{mascaraToken(row.chave)}</code>
                    {row.chave && (
                      <button
                        type="button"
                        className="gestao-icon-btn"
                        title="Copiar token"
                        aria-label="Copiar token"
                        onClick={() => handleCopiar(row.chave, `row-${rowKey}`)}
                      >
                        {copiado === `row-${rowKey}` ? "✓" : "⎘"}
                      </button>
                    )}
                  </div>
                </td>
                <td>
                  <StatusBadge status={st.key} label={st.label} />
                </td>
                <td>{row.criado_por || "—"}</td>
                <td>
                  {row.criado_em
                    ? new Date(row.criado_em).toLocaleString("pt-BR")
                    : "—"}
                </td>
                <td>
                  <div className="gestao-table-actions" style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                    {row.usuario_id && (
                      <button
                        type="button"
                        className="gestao-icon-btn"
                        title="Ver perfil"
                        aria-label="Ver perfil"
                        onClick={() => abrirPerfil(row)}
                        disabled={perfilLoading}
                      >
                        <GestaoIcon name="olho" />
                      </button>
                    )}
                    {row.usuario_id && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setRedefinir(row)}
                      >
                        Redefinir senha
                      </button>
                    )}
                    {row.valido && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setRevogar(row)}
                      >
                        Revogar
                      </button>
                    )}
                    {!row.usuario_id && !row.valido && (
                      <span className="gestao-muted">—</span>
                    )}
                  </div>
                </td>
              </GestaoTableRow>
            );
          })}
        </tbody>
      </GestaoDataTable>

      <Modal
        open={modal}
        onClose={fecharModal}
        title="Novo convite"
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={fecharModal}>
              Cancelar
            </button>
            <button
              type="submit"
              form="form-convite"
              className="btn btn-primary btn-sm"
              disabled={salvando}
            >
              {salvando ? "Criando..." : "Criar colaborador + token"}
            </button>
          </>
        )}
      >
        {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
        <form id="form-convite" className="gestao-form gestao-form--modal" onSubmit={criar}>
          <label className="gestao-field">
            Username
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              autoFocus
              placeholder="jaqueline_rocha"
              autoComplete="off"
            />
          </label>
          <label className="gestao-field">
            Nome
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="Jaqueline Rocha"
            />
          </label>
          <label className="gestao-field">
            E-mail (opcional)
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="nome@empresa.com"
            />
          </label>
          <label className="gestao-field">
            CPF
            <input
              type="text"
              value={form.cpf}
              onChange={(e) => setForm((f) => ({ ...f, cpf: formatarCpf(e.target.value) }))}
              required
              inputMode="numeric"
              placeholder="000.000.000-00"
              autoComplete="off"
            />
          </label>
          <label className="gestao-field">
            Nível de acesso
            <select value={form.nivel_acesso} disabled required>
              {niveisOpcoes.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </label>
          <div className="convites-hint">
            Convidados são sempre nível <strong>Padrão</strong>. Instrutor, gestor e administrador ficam em Equipe.
          </div>
          <div className="convites-hint">
            Senha inicial padrão: <strong>123456</strong>
            <span> — o colaborador redefine no primeiro acesso em interno.</span>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!tokenCriado}
        onClose={() => setTokenCriado(null)}
        title="Token gerado"
        footer={(
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setTokenCriado(null)}
          >
            Fechar
          </button>
        )}
      >
        <p className="convites-sucesso-intro">
          Colaborador <strong>{tokenCriado?.first_name || tokenCriado?.username}</strong> criado.
          Envie o token-key para ativação em{" "}
          <a href={INTERNO_URL} target="_blank" rel="noreferrer">{INTERNO_URL}</a>.
        </p>
        <div className="convites-token-box">
          <code>{tokenCriado?.chave}</code>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleCopiar(tokenCriado?.chave || "", "modal")}
          >
            {copiado === "modal" ? "Copiado!" : "Copiar token"}
          </button>
        </div>
        <p className="gestao-muted" style={{ marginBottom: 0 }}>
          Senha padrão: <strong>{tokenCriado?.senha_padrao || "123456"}</strong>
        </p>
      </Modal>

      <Modal
        open={!!perfil}
        onClose={() => setPerfil(null)}
        title="Perfil do colaborador"
        wide
        footer={(
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setPerfil(null)}>
            Fechar
          </button>
        )}
      >
        {perfil && (
          <dl className="convites-perfil-dl">
            <div><dt>Nome</dt><dd>{perfil.first_name || "—"}</dd></div>
            <div><dt>Username</dt><dd>@{perfil.username}</dd></div>
            <div><dt>E-mail</dt><dd>{perfil.email || "—"}</dd></div>
            <div><dt>CPF</dt><dd>{perfil.cpf ? formatarCpf(perfil.cpf) : "—"}</dd></div>
            <div><dt>Nível de acesso</dt><dd>{NIVEL_LABELS[perfil.nivel_acesso] || perfil.nivel_acesso || "—"}</dd></div>
            <div><dt>Cargo</dt><dd>{perfil.cargo || "—"}</dd></div>
            <div><dt>Setor</dt><dd>{perfil.setor_nome || "Geral"}</dd></div>
            <div><dt>Conta ativa</dt><dd>{perfil.is_active ? "Sim" : "Não"}</dd></div>
            <div><dt>Membro da equipe</dt><dd>{perfil.is_membro_equipe ? "Sim" : "Não"}</dd></div>
            <div><dt>Administrador</dt><dd>{perfil.is_superuser ? "Sim" : "Não"}</dd></div>
            <div><dt>Precisa redefinir senha</dt><dd>{perfil.precisa_redefinir_senha ? "Sim" : "Não"}</dd></div>
            <div><dt>2FA configurado</dt><dd>{perfil.totp_confirmado ? "Sim" : "Não"}</dd></div>
            <div>
              <dt>Cadastro em</dt>
              <dd>{perfil.date_joined ? new Date(perfil.date_joined).toLocaleString("pt-BR") : "—"}</dd>
            </div>
            <div>
              <dt>Último login</dt>
              <dd>{perfil.last_login ? new Date(perfil.last_login).toLocaleString("pt-BR") : "Nunca"}</dd>
            </div>
            <div><dt>Token do convite</dt><dd><code>{perfil.token_chave || "—"}</code></dd></div>
            <div><dt>Status do token</dt><dd>{perfil.token_status || "—"}</dd></div>
            <div><dt>Convite criado por</dt><dd>{perfil.token_criado_por || "—"}</dd></div>
            <div>
              <dt>Convite criado em</dt>
              <dd>
                {perfil.token_criado_em
                  ? new Date(perfil.token_criado_em).toLocaleString("pt-BR")
                  : "—"}
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={!!revogar}
        onClose={() => setRevogar(null)}
        onConfirm={confirmarRevogar}
        title="Revogar convite"
        message={`Revogar o token de "${revogar?.username}"? O colaborador não poderá mais usá-lo.`}
        confirmLabel="Revogar"
        danger
      />

      <ConfirmDialog
        open={!!redefinir}
        onClose={() => setRedefinir(null)}
        onConfirm={confirmarRedefinir}
        title="Redefinir senha"
        message={`Redefinir a senha de "${redefinir?.first_name || redefinir?.username}" para 123456? No próximo login a pessoa deverá escolher outra senha.`}
        confirmLabel="Redefinir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Revogar convites selecionados"
        message={`Revogar ${crud.selection.count} convite(s) selecionado(s)? Apenas tokens válidos serão revogados.`}
        confirmLabel="Revogar selecionados"
        danger
      />
    </div>
  );
}
