import { useMemo } from "react";
import { useLocation } from "react-router-dom";

const ROTAS = [
  { match: /^\/gestao$/, crumbs: [{ label: "Resumo" }] },
  { match: /^\/gestao\/cursos\/\d+$/, crumbs: [{ label: "Cursos", to: "/gestao/cursos" }, { label: "Editar curso" }] },
  { match: /^\/gestao\/cursos$/, crumbs: [{ label: "Cursos" }] },
  { match: /^\/gestao\/trilhas\/\d+$/, crumbs: [{ label: "Trilhas", to: "/gestao/trilhas" }, { label: "Montar trilha" }] },
  { match: /^\/gestao\/trilhas$/, crumbs: [{ label: "Trilhas" }] },
  { match: /^\/gestao\/comunicados$/, crumbs: [{ label: "Comunicados" }] },
  { match: /^\/gestao\/ao-vivo$/, crumbs: [{ label: "Ao vivo" }] },
  { match: /^\/gestao\/biblioteca$/, crumbs: [{ label: "Biblioteca" }] },
  { match: /^\/gestao\/landing$/, crumbs: [{ label: "Landing" }] },
  { match: /^\/gestao\/planos$/, crumbs: [{ label: "Planos" }] },
  { match: /^\/gestao\/tags$/, crumbs: [{ label: "Tags" }] },
  { match: /^\/gestao\/tokens$/, crumbs: [{ label: "Tokens" }] },
  { match: /^\/gestao\/equipe$/, crumbs: [{ label: "Equipe" }] },
];

export default function useGestaoBreadcrumb() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const rota = ROTAS.find((r) => r.match.test(pathname));
    return {
      area: "Área de gestão de conteúdo",
      crumbs: rota?.crumbs ?? [{ label: "Gestão" }],
    };
  }, [pathname]);
}
