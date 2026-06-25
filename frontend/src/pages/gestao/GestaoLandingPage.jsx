import { useEffect, useMemo, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoBulkActions from "../../components/gestao/GestaoBulkActions";
import GestaoDataTable, { GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoFilterTabs from "../../components/gestao/GestaoFilterTabs";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import { GestaoSelectCell, GestaoSelectHeaderCell } from "../../components/gestao/GestaoTableCheckbox";
import GestaoTableActions from "../../components/gestao/GestaoTableActions";
import StatusBadge from "../../components/gestao/StatusBadge";
import useGestaoCrudTable from "../../hooks/useGestaoCrudTable";
import { gestaoApi } from "../../services/gestaoApi";

const FAIXA_VAZIA = {
  mensagem: "",
  texto_botao: "",
  url_botao: "",
  exibir_countdown: false,
  data_fim_countdown: "",
  ativo: true,
};

const BANNER_VAZIO = {
  titulo: "",
  subtitulo: "",
  link: "",
  ordem: 0,
  ativo: true,
};

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function GestaoLandingPage() {
  const [aba, setAba] = useState("faixa");
  const [faixa, setFaixa] = useState(FAIXA_VAZIA);
  const [banners, setBanners] = useState([]);
  const [modal, setModal] = useState({ open: false, item: null });
  const [faixaModal, setFaixaModal] = useState(false);
  const [formFaixa, setFormFaixa] = useState(FAIXA_VAZIA);
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(BANNER_VAZIO);
  const [gifFile, setGifFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");
  const crud = useGestaoCrudTable();

  const carregarFaixa = () =>
    gestaoApi.obterFaixaLanding().then((data) => {
      setFaixa({
        ...FAIXA_VAZIA,
        ...data,
        data_fim_countdown: toDatetimeLocal(data.data_fim_countdown),
      });
    });

  const carregarBanners = () => gestaoApi.listarBannersLanding().then(setBanners);

  useEffect(() => {
    carregarFaixa().catch(() => setFaixa(FAIXA_VAZIA));
    carregarBanners();
  }, []);

  useEffect(() => {
    if (modal.item) {
      setForm({ ...BANNER_VAZIO, ...modal.item });
    } else {
      setForm(BANNER_VAZIO);
    }
    setGifFile(null);
  }, [modal]);

  useEffect(() => {
    if (faixaModal) {
      setFormFaixa({ ...faixa });
      setErro("");
    }
  }, [faixaModal, faixa]);

  const salvarFaixa = async (e) => {
    e.preventDefault();
    setErro("");
    setMsg("");
    try {
      const payload = {
        ...formFaixa,
        data_fim_countdown: formFaixa.data_fim_countdown
          ? new Date(formFaixa.data_fim_countdown).toISOString()
          : null,
      };
      await gestaoApi.atualizarFaixaLanding(payload);
      setMsg("Faixa salva.");
      setFaixaModal(false);
      carregarFaixa();
    } catch (err) {
      setErro(err.message);
    }
  };

  const salvarBanner = async (e) => {
    e.preventDefault();
    setErro("");
    try {
      let banner;
      if (modal.item) {
        banner = await gestaoApi.atualizarBannerLanding(modal.item.id, form);
      } else {
        banner = await gestaoApi.criarBannerLanding(form);
      }
      if (gifFile) {
        await gestaoApi.uploadBannerGif(banner.id, gifFile);
      } else if (!modal.item) {
        throw new Error("Envie um arquivo GIF para o novo banner.");
      }
      setModal({ open: false, item: null });
      carregarBanners();
    } catch (err) {
      setErro(err.message);
    }
  };

  const pageIds = useMemo(() => banners.map((b) => b.id), [banners]);

  const confirmarLote = async () => {
    await crud.confirmarLote((id) => gestaoApi.excluirBannerLanding(id), { sucesso: "banners excluídos" });
    carregarBanners();
  };

  return (
    <div>
      <GestaoPageHeader
        icon="landing"
        title="Landing page"
        subtitle="Configure a faixa promocional e os banners da página pública"
      />

      <GestaoFilterTabs
        options={[
          { value: "faixa", label: "Faixa promocional" },
          { value: "banners", label: "Banners GIF" },
        ]}
        value={aba}
        onChange={setAba}
      />

      {erro && <div className="modal-alert modal-alert--error">{erro}</div>}
      {msg && <div className="modal-alert" style={{ background: "#dcfce7", color: "#166534", marginBottom: "1rem" }}>{msg}</div>}

      {aba === "faixa" && (
        <>
          <div className="gestao-page-header" style={{ marginTop: 0 }}>
            <p className="gestao-muted">Faixa promocional no topo da landing pública</p>
            <button type="button" className="btn btn-primary gestao-btn-cta" onClick={() => setFaixaModal(true)}>
              <GestaoIcon name="editar" />
              Editar faixa
            </button>
          </div>

          <div className="gestao-form-card" style={{ maxWidth: 560 }}>
            <p className="gestao-muted" style={{ margin: "0 0 0.5rem" }}>Mensagem</p>
            <p style={{ margin: "0 0 1rem" }}>{faixa.mensagem || "—"}</p>
            <p className="gestao-muted" style={{ margin: "0 0 0.5rem" }}>Botão</p>
            <p style={{ margin: "0 0 1rem" }}>
              {faixa.texto_botao || "—"}
              {faixa.url_botao ? ` → ${faixa.url_botao}` : ""}
            </p>
            <p className="gestao-muted" style={{ margin: "0 0 0.5rem" }}>Status</p>
            <p style={{ margin: 0 }}>
              <StatusBadge status={faixa.ativo ? "ativo" : "inativo"} />
              {faixa.exibir_countdown && faixa.data_fim_countdown && (
                <span className="gestao-muted" style={{ marginLeft: "0.75rem" }}>
                  Countdown até {new Date(faixa.data_fim_countdown).toLocaleString("pt-BR")}
                </span>
              )}
            </p>
          </div>
        </>
      )}

      {aba === "banners" && (
        <>
          <div className="gestao-page-header" style={{ marginTop: 0 }}>
            <p className="gestao-muted">Carrossel do hero — apenas arquivos .gif</p>
            <button
              type="button"
              className="btn btn-primary gestao-btn-cta"
              onClick={() => setModal({ open: true, item: null })}
            >
              <GestaoIcon name="mais" />
              Novo banner
            </button>
          </div>

          {crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

          <div className="gestao-toolbar-wrap gestao-animate-in gestao-animate-in--delay-1">
            <GestaoBulkActions
              count={crud.selection.count}
              actionLabel="Excluir selecionados"
              onAction={() => crud.setLoteOpen(true)}
              onClear={crud.selection.clear}
              loading={crud.loteLoading}
            />
          </div>

          <GestaoDataTable
            loading={false}
            empty={banners.length === 0}
            emptyTitle="Nenhum banner cadastrado"
            skeletonCols={6}
          >
            <thead>
              <tr>
                <GestaoSelectHeaderCell
                  checked={crud.selection.isAllSelected(pageIds)}
                  indeterminate={crud.selection.isIndeterminate(pageIds)}
                  onChange={() => crud.selection.toggleAll(pageIds)}
                  disabled={!banners.length}
                />
                <th>Ordem</th>
                <th>Preview</th>
                <th>Título</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b, i) => (
                <GestaoTableRow key={b.id} index={i} selected={crud.selection.isSelected(b.id)}>
                  <GestaoSelectCell
                    checked={crud.selection.isSelected(b.id)}
                    onChange={() => crud.selection.toggle(b.id)}
                  />
                  <td>{b.ordem}</td>
                  <td>
                    {b.imagem_url ? (
                      <img src={b.imagem_url} alt="" style={{ height: 48, borderRadius: 4 }} />
                    ) : "—"}
                  </td>
                  <td>{b.titulo || "—"}</td>
                  <td><StatusBadge status={b.ativo ? "ativo" : "inativo"} /></td>
                  <td>
                    <GestaoTableActions
                      onEdit={() => setModal({ open: true, item: b })}
                      onDelete={() => setExcluir(b)}
                    />
                  </td>
                </GestaoTableRow>
              ))}
            </tbody>
          </GestaoDataTable>
        </>
      )}

      <Modal
        open={faixaModal}
        onClose={() => setFaixaModal(false)}
        title="Editar faixa promocional"
        wide
        footer={(
          <>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setFaixaModal(false)}>Cancelar</button>
            <button type="submit" form="form-faixa" className="btn btn-primary btn-sm">Salvar faixa</button>
          </>
        )}
      >
        <form id="form-faixa" className="gestao-form gestao-form--modal" onSubmit={salvarFaixa}>
          <label className="gestao-field">
            Mensagem
            <input
              value={formFaixa.mensagem}
              onChange={(e) => setFormFaixa({ ...formFaixa, mensagem: e.target.value })}
              required
              placeholder="Ex.: Novos treinamentos disponíveis!"
            />
          </label>
          <label className="gestao-field">
            Texto do botão
            <input
              value={formFaixa.texto_botao}
              onChange={(e) => setFormFaixa({ ...formFaixa, texto_botao: e.target.value })}
              placeholder="Ver planos"
            />
          </label>
          <label className="gestao-field">
            Link do botão
            <input
              value={formFaixa.url_botao}
              onChange={(e) => setFormFaixa({ ...formFaixa, url_botao: e.target.value })}
              placeholder="#planos ou https://..."
            />
          </label>
          <label className="gestao-checkbox">
            <input
              type="checkbox"
              checked={formFaixa.exibir_countdown}
              onChange={(e) => setFormFaixa({ ...formFaixa, exibir_countdown: e.target.checked })}
            />
            Exibir contador regressivo
          </label>
          {formFaixa.exibir_countdown && (
            <label className="gestao-field">
              Data/hora fim do contador
              <input
                type="datetime-local"
                value={formFaixa.data_fim_countdown}
                onChange={(e) => setFormFaixa({ ...formFaixa, data_fim_countdown: e.target.value })}
              />
            </label>
          )}
          <label className="gestao-checkbox">
            <input
              type="checkbox"
              checked={formFaixa.ativo}
              onChange={(e) => setFormFaixa({ ...formFaixa, ativo: e.target.checked })}
            />
            Faixa ativa na landing
          </label>
        </form>
      </Modal>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, item: null })}
        title={modal.item ? "Editar banner" : "Novo banner"}
        wide
      >
        <form className="gestao-form gestao-form--modal" onSubmit={salvarBanner}>
          <label className="gestao-field">
            Título (overlay)
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </label>
          <label className="gestao-field">
            Subtítulo
            <input value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} />
          </label>
          <label className="gestao-field">
            Link ao clicar
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
          </label>
          <div className="gestao-form-row gestao-form-row--2">
            <label className="gestao-field">
              Ordem
              <input
                type="number"
                min={0}
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) })}
              />
            </label>
            <label className="gestao-checkbox" style={{ alignSelf: "end", paddingBottom: "0.5rem" }}>
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
              />
              Ativo
            </label>
          </div>
          <label className="gestao-field">
            Arquivo GIF {modal.item ? "(opcional para substituir)" : "(obrigatório)"}
            <input
              type="file"
              accept="image/gif,.gif"
              onChange={(e) => setGifFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setModal({ open: false, item: null })}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary btn-sm">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => {
          await gestaoApi.excluirBannerLanding(excluir.id);
          carregarBanners();
        }}
        title="Excluir banner"
        message={`Excluir o banner "${excluir?.titulo || excluir?.id}"?`}
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={crud.loteOpen}
        onClose={() => crud.setLoteOpen(false)}
        onConfirm={confirmarLote}
        title="Excluir banners selecionados"
        message={`Excluir ${crud.selection.count} banner(s) selecionado(s)?`}
        confirmLabel="Excluir selecionados"
        danger
      />
    </div>
  );
}
