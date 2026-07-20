import { useCallback, useEffect, useState } from "react";
import GestaoDataTable, { GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoConvitesPage() {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    email: "",
    cargo: "Colaborador",
  });
  const [criando, setCriando] = useState(false);
  const [ultimoToken, setUltimoToken] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const data = await gestaoApi.listarConvites();
      setItens(Array.isArray(data) ? data : []);
    } catch (err) {
      setErro(err.message || "Falha ao carregar convites.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErro("");
    setOk("");
    setCriando(true);
    try {
      const data = await gestaoApi.criarConvite(form);
      setUltimoToken(data);
      setOk(`Token gerado para ${data.username}. Senha padrão: ${data.senha_padrao}`);
      setForm({ username: "", first_name: "", email: "", cargo: "Colaborador" });
      await carregar();
    } catch (err) {
      setErro(err.message || "Não foi possível criar o convite.");
    } finally {
      setCriando(false);
    }
  };

  const revogar = async (id) => {
    if (!window.confirm("Revogar este token?")) return;
    try {
      await gestaoApi.revogarConvite(id);
      await carregar();
    } catch (err) {
      setErro(err.message || "Falha ao revogar.");
    }
  };

  return (
    <div>
      <GestaoPageHeader
        title="Convites (token-key)"
        subtitle="Crie colaboradores da plataforma e gere o token de primeiro acesso em interno."
      />

      {erro && <div className="alert alert-error">{erro}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}
      {ultimoToken?.chave && (
        <div className="alert alert-success">
          Token-key: <strong>{ultimoToken.chave}</strong> — envie ao colaborador.
        </div>
      )}

      <form onSubmit={handleCreate} className="gestao-form" style={{ marginBottom: "1.5rem" }}>
        <div className="gestao-form-grid">
          <label>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              placeholder="jaqueline_rocha"
            />
          </label>
          <label>
            Nome
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              placeholder="Jaqueline Rocha"
            />
          </label>
          <label>
            E-mail (opcional)
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label>
            Cargo
            <input
              value={form.cargo}
              onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
            />
          </label>
        </div>
        <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", opacity: 0.8 }}>
          Senha inicial padrão: <strong>123456</strong> (o colaborador redefine no primeiro acesso).
        </p>
        <button type="submit" className="btn btn-primary" disabled={criando}>
          {criando ? "Criando..." : "Criar colaborador + token"}
        </button>
      </form>

      <GestaoDataTable loading={loading} empty={!loading && itens.length === 0} skeletonCols={6}>
        <thead>
          <tr>
            <th>Token</th>
            <th>Usuário</th>
            <th>Nome</th>
            <th>Status</th>
            <th>Criado em</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((row, index) => (
            <GestaoTableRow key={row.id} index={index}>
              <td><code>{row.chave}</code></td>
              <td>{row.username}</td>
              <td>{row.first_name || "—"}</td>
              <td>{row.usado_em ? "Usado" : row.valido ? "Válido" : "Inválido"}</td>
              <td>{row.criado_em ? new Date(row.criado_em).toLocaleString("pt-BR") : "—"}</td>
              <td>
                {row.valido ? (
                  <button type="button" className="btn btn-ghost" onClick={() => revogar(row.id)}>
                    Revogar
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>
    </div>
  );
}
