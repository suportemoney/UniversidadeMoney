# UniversidadeMoney

Monorepo Docker: **Django + DRF**, dois frontends Vite (**plataforma** e **painel**), portal **interno** (token-key).

## Frontends

| App | Porta local | Produção |
|-----|-------------|----------|
| `frontend-plataforma` | 5173 | `plataforma.moneypromotora.com.br` |
| `frontend-painel` | 5174 | `painel-interno.moneypromotora.com.br` |
| plataforma modo `interno` | 5175 | `interno.moneypromotora.com.br` |

## Dev local

```bash
cp .env.development.example .env.development
docker compose -f compose.yml -f compose.dev.yml --env-file .env.development up --build
```

Ou sem Docker nos fronts:

```bash
cd frontend-plataforma && npm ci && npm run dev
cd frontend-plataforma && npm run dev:interno
cd frontend-painel && npm ci && npm run dev
```

## Token-key

No painel: **Convites** → cria username (ex. `jaqueline_rocha`) + token.  
Colaborador ativa em **interno** e depois faz login na **plataforma** com CPF.

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/docker.md](docs/docker.md)
