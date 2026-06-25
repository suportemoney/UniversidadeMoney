import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoFilterTabs from "../../components/gestao/GestaoFilterTabs";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
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
  const [excluir, setExcluir] = useState(null);
  const [form, setForm] = useState(BANNER_VAZIO);
  const [gifFile, setGifFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [erro, setErro] = useState("");

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

  const salvarFaixa = async (e) => {
    e.preventDefault();
    setErro("");
    setMsg("");
    try {
      const payload = {
        ...faixa,
        data_fim_countdown: faixa.data_fim_countdown
          ? new Date(faixa.data_fim_countdown).toISOString()
          : null,
      };
      await gestaoApi.atualizarFaixaLanding(payload);
      setMsg("Faixa salva.");
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
        <form className="gestao-form" onSubmit={salvarFaixa} style={{ maxWidth: 560 }}>
          <label className="gestao-field">
            Mensagem
            <input
              value={faixa.mensagem}
              onChange={(e) => setFaixa({ ...faixa, mensagem: e.target.value })}
              required
              placeholder="Ex.: Novos treinamentos disponíveis!"
            />
          </label>
          <label className="gestao-field">
            Texto do botão
            <input
              value={faixa.texto_botao}
              onChange={(e) => setFaixa({ ...faixa, texto_botao: e.target.value })}
              placeholder="Ver planos"
            />
          </label>
          <label className="gestao-field">
            Link do botão
            <input
              value={faixa.url_botao}
              onChange={(e) => setFaixa({ ...faixa, url_botao: e.target.value })}
              placeholder="#planos ou https://..."
            />
          </label>
          <label className="gestao-checkbox">
            <input
              type="checkbox"
              checked={faixa.exibir_countdown}
              onChange={(e) => setFaixa({ ...faixa, exibir_countdown: e.target.checked })}
            />
            Exibir contador regressivo
          </label>
          {faixa.exibir_countdown && (
            <label className="gestao-field">
              Data/hora fim do contador
              <input
                type="datetime-local"
                value={faixa.data_fim_countdown}
                onChange={(e) => setFaixa({ ...faixa, data_fim_countdown: e.target.value })}
              />
            </label>
          )}
          <label className="gestao-checkbox">
            <input
              type="checkbox"
              checked={faixa.ativo}
              onChange={(e) => setFaixa({ ...faixa, ativo: e.target.checked })}
            />
            Faixa ativa na landing
          </label>
          <button type="submit" className="btn btn-primary btn-sm">Salvar faixa</button>
        </form>
      )}

      {aba === "banners" && (
        <>
          <div className="gestao-page-header" style={{ marginTop: 0 }}>
            <p className="gestao-muted">Carrossel do hero — apenas arquivos .gif</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModal({ open: true, item: null })}
            >
              Novo banner
            </button>
          </div>
          <table className="gestao-table">
            <thead>
              <tr>
                <th>Ordem</th>
                <th>Preview</th>
                <th>Título</th>
                <th>Ativo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td>{b.ordem}</td>
                  <td>
                    {b.imagem_url ? (
                      <img src={b.imagem_url} alt="" style={{ height: 48, borderRadius: 4 }} />
                    ) : "—"}
                  </td>
                  <td>{b.titulo || "—"}</td>
                  <td>{b.ativo ? "Sim" : "Não"}</td>
                  <td>
                    <button type="button" className="btn-link" onClick={() => setModal({ open: true, item: b })}>
                      Editar
                    </button>
                    {" · "}
                    <button type="button" className="btn-link" onClick={() => setExcluir(b)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

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
    </div>
  );
}
