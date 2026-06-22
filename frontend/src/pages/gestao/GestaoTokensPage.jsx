import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
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
  const [modal, setModal] = useState(false);
  const [usosModal, setUsosModal] = useState(null);
  const [usos, setUsos] = useState([]);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [chaveCriada, setChaveCriada] = useState("");

  const carregar = () => gestaoApi.listarTokens().then(setTokens);

  useEffect(() => {
    carregar();
    gestaoApi.listarPlanos().then(setPlanos);
  }, []);

  useEffect(() => {
    if (modal) {
      setForm({
        ...FORM_VAZIO,
        plano: planos[0]?.id || "",
      });
      setErro("");
      setChaveCriada("");
    }
  }, [modal, planos]);

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

  const toggleAtivo = async (token) => {
    await gestaoApi.atualizarToken(token.id, { ativo: !token.ativo });
    carregar();
  };

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Tokens de plano</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>
          Gerar token
        </button>
      </div>

      <table className="gestao-table">
        <thead>
          <tr>
            <th>Chave</th>
            <th>Plano</th>
            <th>Usos</th>
            <th>Expiração</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.id}>
              <td>
                <code>{t.chave}</code>{" "}
                <button type="button" className="btn-link" onClick={() => copiarChave(t.chave)}>
                  Copiar
                </button>
              </td>
              <td>{t.plano_titulo}</td>
              <td>{t.usos_realizados} / {t.max_usos}</td>
              <td>
                {t.tipo_expiracao === "data_fixa"
                  ? `Até ${t.data_fim ? new Date(t.data_fim).toLocaleDateString("pt-BR") : "—"}`
                  : `${t.duracao_dias || "—"} dias após resgate`}
              </td>
              <td>{t.ativo ? "Ativo" : "Inativo"}</td>
              <td>
                <button type="button" className="btn-link" onClick={() => verUsos(t)}>Usos</button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => toggleAtivo(t)}>
                  {t.ativo ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal} onClose={() => setModal(false)} title="Gerar token">
        {chaveCriada ? (
          <div>
            <p>Token criado com sucesso:</p>
            <p><code style={{ fontSize: "1.1rem" }}>{chaveCriada}</code></p>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => copiarChave(chaveCriada)}>
              Copiar chave
            </button>
            <div className="modal-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            {erro && <div className="alert alert-error">{erro}</div>}
            <form className="gestao-form" onSubmit={criar}>
              <label>
                Plano
                <select
                  value={form.plano}
                  onChange={(e) => setForm({ ...form, plano: e.target.value })}
                  required
                >
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))}
                </select>
              </label>
              <label>
                Máximo de usos
                <input
                  type="number"
                  min={1}
                  value={form.max_usos}
                  onChange={(e) => setForm({ ...form, max_usos: e.target.value })}
                  required
                />
              </label>
              <label>
                Tipo de expiração
                <select
                  value={form.tipo_expiracao}
                  onChange={(e) => setForm({ ...form, tipo_expiracao: e.target.value })}
                >
                  <option value="duracao">Duração (dias após resgate)</option>
                  <option value="data_fixa">Data fixa de fim</option>
                </select>
              </label>
              {form.tipo_expiracao === "duracao" ? (
                <label>
                  Duração (dias)
                  <input
                    type="number"
                    min={1}
                    value={form.duracao_dias}
                    onChange={(e) => setForm({ ...form, duracao_dias: e.target.value })}
                    required
                  />
                </label>
              ) : (
                <label>
                  Data fim do benefício
                  <input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                    required
                  />
                </label>
              )}
              <label>
                Válido para resgate até (opcional)
                <input
                  type="date"
                  value={form.valido_ate_resgate}
                  onChange={(e) => setForm({ ...form, valido_ate_resgate: e.target.value })}
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm">Gerar</button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <Modal open={!!usosModal} onClose={() => setUsosModal(null)} title={`Usos — ${usosModal?.chave}`}>
        {usos.length === 0 ? (
          <p>Nenhum resgate registrado.</p>
        ) : (
          <table className="gestao-table">
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
    </div>
  );
}
