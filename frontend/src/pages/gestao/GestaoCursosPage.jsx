import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import GestaoDataTable, { GestaoCellCurso, GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoPagination from "../../components/gestao/GestaoPagination";
import GestaoTableActions from "../../components/gestao/GestaoTableActions";
import GestaoToolbar from "../../components/gestao/GestaoToolbar";
import StatusBadge from "../../components/gestao/StatusBadge";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";

const STATUS = [
  { value: "", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "publicado", label: "Publicado" },
  { value: "arquivado", label: "Arquivado" },
];

const PAGE_SIZE = 8;

export default function GestaoCursosPage() {
  const [cursos, setCursos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [excluir, setExcluir] = useState(null);

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarCursos(filtro || undefined)
      .then(setCursos)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, [filtro]);

  const {
    busca,
    setBusca,
    page,
    setPage,
    paginados,
    totalPages,
    totalItems,
    pageSize,
  } = usePaginatedList(cursos, { searchKeys: ["titulo", "descricao"], pageSize: PAGE_SIZE });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);

  return (
    <div>
      <GestaoPageHeader
        icon="cursos"
        title="Cursos"
        subtitle="Gerencie e organize os cursos da plataforma"
      >
        <Link to="/gestao/cursos/novo" className="btn btn-primary gestao-btn-cta">
          <GestaoIcon name="mais" />
          Novo curso
        </Link>
      </GestaoPageHeader>

      <GestaoToolbar
        filterOptions={STATUS}
        filterValue={filtro}
        onFilterChange={(v) => { setFiltro(v); setPage(1); }}
        searchValue={busca}
        onSearchChange={setBusca}
        searchPlaceholder="Buscar cursos..."
      />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhum curso encontrado"
        emptyMessage="Crie um novo curso ou ajuste os filtros de busca."
        emptyAction={(
          <Link to="/gestao/cursos/novo" className="btn btn-primary btn-sm">
            Criar primeiro curso
          </Link>
        )}
        skeletonCols={5}
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
            <th>Curso</th>
            <th>Status</th>
            <th>Setor</th>
            <th>Módulos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {paginados.map((c, i) => (
            <GestaoTableRow key={c.id} index={i}>
              <td>
                <GestaoCellCurso
                  titulo={c.titulo}
                  descricao={c.descricao || "Sem descrição"}
                />
              </td>
              <td><StatusBadge status={c.status} /></td>
              <td>{c.setor_nome || "—"}</td>
              <td>{c.total_modulos}</td>
              <td>
                <GestaoTableActions
                  editTo={`/gestao/cursos/${c.id}`}
                  onDelete={() => setExcluir(c)}
                />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>

      <ConfirmDialog
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onConfirm={async () => {
          await gestaoApi.excluirCurso(excluir.id);
          carregar();
        }}
        title="Excluir curso"
        message={`Excluir "${excluir?.titulo}"?`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
}
