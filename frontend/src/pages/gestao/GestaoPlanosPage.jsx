import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
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
  const [todasTags, setTodasTags] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState("");

  const carregar = () => gestaoApi.listarPlanos().then(setItens);

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

  return (
    <div>
      <div className="gestao-page-header">
        <h1>Planos</h1>
        <button type="button" className="btn btn-primary" onClick={() => setModal({ open: true, item: null })}>
          Novo plano
        </button>
      </div>

      <table className="gestao-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Módulos</th>
            <th>Tags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {itens.map((p) => (
            <tr key={p.id}>
              <td>{p.titulo}</td>
              <td><code>{p.slug}</code></td>
              <td>{p.ativo ? "Ativo" : "Inativo"}</td>
              <td>
                {MODULOS_RESTRITOS.filter((f) => p[f.key]).map((f) => f.label).join(", ") || "—"}
              </td>
              <td>
                {p.tags_cursos_detalhe?.length
                  ? p.tags_cursos_detalhe.map((t) => t.nome).join(", ")
                  : "Todos"}
              </td>
              <td>
                <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: p })}>
                  Editar
                </button>
                {" · "}
                <button type="button" className="btn-link" onClick={() => setExcluir(p)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
    </div>
  );
}
