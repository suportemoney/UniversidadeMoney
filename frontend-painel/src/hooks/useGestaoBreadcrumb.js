import { useMemo } from "react";
import { useLocation } from "react-router-dom";

const ROTAS = [
  { match: /^\/gestao$/, crumbs: [{ label: "Resumo" }] },
  { match: /^\/gestao\/convites$/, crumbs: [{ label: "Convites" }] },
  { match: /^\/gestao\/api$/, crumbs: [{ label: "API" }] },
  { match: /^\/gestao\/cursos$/, crumbs: [{ label: "Cursos" }] },
  { match: /^\/gestao\/setores$/, crumbs: [{ label: "Setores" }] },
  { match: /^\/gestao\/trilhas\/\d+$/, crumbs: [{ label: "Trilhas", to: "/gestao/trilhas" }, { label: "Montar trilha" }] },
  { match: /^\/gestao\/trilhas$/, crumbs: [{ label: "Trilhas" }] },
  { match: /^\/gestao\/comunicados$/, crumbs: [{ label: "Comunicados" }] },
  { match: /^\/gestao\/ao-vivo$/, crumbs: [{ label: "Ao vivo" }] },
  { match: /^\/gestao\/biblioteca$/, crumbs: [{ label: "Biblioteca" }] },
  { match: /^\/gestao\/tags$/, crumbs: [{ label: "Tags" }] },
  { match: /^\/gestao\/equipe$/, crumbs: [{ label: "Equipe" }] },
];

export default function useGestaoBreadcrumb() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const rota = ROTAS.find((r) => r.match.test(pathname));
    return {
      area: "Gestão",
      crumbs: rota?.crumbs ?? [{ label: "Início" }],
    };
  }, [pathname]);
}
