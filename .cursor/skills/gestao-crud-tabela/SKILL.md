---
name: gestao-crud-tabela
description: Padroniza listagens da área Gestão como CRUD completo com checkboxes e ações em lote. Use ao criar ou alterar páginas em frontend/src/pages/gestao/ que exibem tabelas ou GestaoDataTable.
---

# Gestão — Tabela CRUD obrigatória

## Regra

Todo template de **Gestão** que exibe `<table>`, `GestaoDataTable` ou listagem tabular deve implementar **CRUD completo**:

| Operação | Obrigatório |
|----------|-------------|
| **Criar** | Botão/modal/rota de criação |
| **Ler** | Listagem com busca/filtros quando aplicável |
| **Alterar** | Editar linha (modal ou rota) |
| **Deletar** | Ação destrutiva por linha + **seleção em lote via checkbox** |

## Componentes e hooks

```
frontend/src/hooks/useGestaoTableSelection.js   — estado dos checkboxes
frontend/src/hooks/useGestaoCrudTable.js        — seleção + confirmação em lote
frontend/src/utils/gestaoLote.js              — executarEmLote()
frontend/src/components/gestao/GestaoTableCheckbox.jsx  — coluna checkbox
frontend/src/components/gestao/GestaoBulkActions.jsx    — barra "N selecionados"
```

## Estrutura mínima da página

```jsx
const crud = useGestaoCrudTable();
const pageIds = paginados.map((item) => item.id);

<GestaoPageHeader ...>{/* CTA Criar */}</GestaoPageHeader>

<GestaoToolbar
  bulkActions={
    <GestaoBulkActions
      count={crud.selection.count}
      actionLabel="Excluir selecionados"
      onAction={() => crud.setLoteOpen(true)}
      onClear={crud.selection.clear}
      loading={crud.loteLoading}
    />
  }
  searchValue={busca}
  onSearchChange={setBusca}
/>

{crud.loteMsg && <div className="gestao-lote-alert">{crud.loteMsg}</div>}

<GestaoDataTable ...>
  <thead>
    <tr>
      <GestaoSelectHeaderCell
        checked={crud.selection.isAllSelected(pageIds)}
        indeterminate={crud.selection.isIndeterminate(pageIds)}
        onChange={() => crud.selection.toggleAll(pageIds)}
        disabled={!paginados.length}
      />
      {/* demais colunas */}
    </tr>
  </thead>
  <tbody>
    {paginados.map((item, i) => (
      <GestaoTableRow key={item.id} index={i} selected={crud.selection.isSelected(item.id)}>
        <GestaoSelectCell
          checked={crud.selection.isSelected(item.id)}
          onChange={() => crud.selection.toggle(item.id)}
        />
        {/* células + GestaoTableActions */}
      </GestaoTableRow>
    ))}
  </tbody>
</GestaoDataTable>

<ConfirmDialog /* exclusão individual */ />
<ConfirmDialog /* lote */ open={crud.loteOpen} onConfirm={async () => {
  await crud.confirmarLote((id) => gestaoApi.excluirX(id), { sucesso: "itens excluídos" });
  carregar();
}} />
```

## Create / Update — modal vs rota

| Cenário | Padrão |
|---------|--------|
| Entidade simples (tags, planos, comunicados) | Modal |
| Entidade complexa (curso com módulos) | Rota dedicada (`/gestao/cursos/:id`) |
| Criação rápida inline (trilha) | Form acima da tabela + editor em rota |

## Exclusão em lote

- Usar `executarEmLote(ids, fn)` com `Promise.allSettled` — não abortar no primeiro erro
- "Selecionar todos" afeta **somente a página atual** (paginação client-side)
- Após lote: `selection.clear()` + recarregar listagem
- Exibir `gestao-lote-alert` se houver falhas parciais

## Exceções documentadas

| Página | "Deletar" significa |
|--------|---------------------|
| **Tokens** | Cancelar/inativar (`ativo: false`) — não há DELETE |
| **Equipe** | Remover da equipe (`toggleEquipe(id, false)`) — não exclui usuário |
| **Modais read-only** (usos de token) | Sem CRUD — somente leitura |
| **Editores aninhados** (curso editor) | CRUD interno de módulos/aulas — padrão próprio |

## Referência

Página modelo: `frontend/src/pages/gestao/GestaoCursosPage.jsx`

## Checklist antes de concluir

- [ ] Criar, listar, editar e deletar (individual)
- [ ] Coluna checkbox + selecionar todos (página)
- [ ] Barra de ações em lote
- [ ] ConfirmDialog individual + ConfirmDialog lote
- [ ] Mensagens em pt-br
- [ ] Build Vite sem erros
