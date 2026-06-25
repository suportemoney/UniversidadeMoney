const VARIANTS = {
  publicado: "gestao-status--publicado",
  rascunho: "gestao-status--rascunho",
  arquivado: "gestao-status--arquivado",
  ativo: "gestao-status--ativo",
  inativo: "gestao-status--inativo",
  info: "gestao-status--info",
  trofeu: "gestao-status--trofeu",
  megafone: "gestao-status--megafone",
};

const LABELS = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  arquivado: "Arquivado",
  ativo: "Ativo",
  inativo: "Inativo",
  info: "Informação",
  trofeu: "Conquista",
  megafone: "Aviso",
};

export default function StatusBadge({ status, label }) {
  const key = (status || "").toLowerCase();
  const classe = VARIANTS[key] || "gestao-status--default";
  const texto = label || LABELS[key] || status;

  return <span className={`gestao-status ${classe}`}>{texto}</span>;
}
