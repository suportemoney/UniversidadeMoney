import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GestaoDataTable, { GestaoCellCurso, GestaoTableRow } from "../../components/gestao/GestaoDataTable";
import GestaoIcon from "../../components/gestao/GestaoIcons";
import GestaoPageHeader from "../../components/gestao/GestaoPageHeader";
import GestaoPagination from "../../components/gestao/GestaoPagination";
import GestaoTableActions from "../../components/gestao/GestaoTableActions";
import GestaoToolbar from "../../components/gestao/GestaoToolbar";
import usePaginatedList from "../../hooks/usePaginatedList";
import { gestaoApi } from "../../services/gestaoApi";

export default function GestaoTrilhasPage() {
  const [trilhas, setTrilhas] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    setLoading(true);
    return gestaoApi.listarTrilhas().then(setTrilhas).finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const {
    busca, setBusca, page, setPage, paginados, totalPages, totalItems, pageSize,
  } = usePaginatedList(trilhas, { searchKeys: ["titulo"], pageSize: 8 });

  const vazio = useMemo(() => !loading && totalItems === 0, [loading, totalItems]);

  const criar = async (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    await gestaoApi.criarTrilha({ titulo });
    setTitulo("");
    carregar();
  };

  return (
    <div>
      <GestaoPageHeader
        icon="trilhas"
        title="Trilhas"
        subtitle="Organize sequências de cursos para os alunos"
      />

      <form className="gestao-form-card gestao-animate-in gestao-animate-in--delay-1" onSubmit={criar}>
        <div className="gestao-form-inline">
          <input
            placeholder="Nome da nova trilha"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm gestao-btn-cta">
            <GestaoIcon name="mais" />
            Criar trilha
          </button>
        </div>
      </form>

      <GestaoToolbar searchValue={busca} onSearchChange={setBusca} searchPlaceholder="Buscar trilhas..." />

      <GestaoDataTable
        loading={loading}
        empty={vazio}
        emptyTitle="Nenhuma trilha cadastrada"
        emptyMessage="Crie uma trilha acima para começar."
        skeletonCols={3}
        footer={!vazio && !loading ? (
          <GestaoPagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
        ) : null}
      >
        <thead>
          <tr><th>Trilha</th><th>Cursos</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {paginados.map((t, i) => (
            <GestaoTableRow key={t.id} index={i}>
              <td>
                <GestaoCellCurso titulo={t.titulo} descricao={`${t.itens?.length || 0} curso(s) na trilha`} />
              </td>
              <td>{t.itens?.length || 0}</td>
              <td>
                <GestaoTableActions editTo={`/gestao/trilhas/${t.id}`} editLabel="Montar" />
              </td>
            </GestaoTableRow>
          ))}
        </tbody>
      </GestaoDataTable>
    </div>
  );
}
