# UniversidadeMoney

Monorepo Docker: **Django + DRF**, dois frontends Vite (**plataforma** e **painel**), portal **interno** (token-key).

LMS **interno** de colaboradores (sem planos comerciais no fluxo). Integração via **API Key** hasheada.

## Frontends

| App | Porta local | Produção |
|-----|-------------|----------|
| `frontend-plataforma` | 5173 | `https://universidade.moneypromotora.com.br/` |
| plataforma modo `interno` | 5175 | `https://universidade.moneypromotora.com.br/interno/` |
| `frontend-painel` | 5174 | `https://universidade.moneypromotora.com.br/painel/` |

## Dev local

```bash
cp .env.exemple .env
docker compose -f compose.yml -f compose.dev.yml --env-file .env up --build
```

Ou sem Docker nos fronts:

```bash
cd frontend-plataforma && npm ci && npm run dev
cd frontend-plataforma && npm run dev:interno
cd frontend-painel && npm ci && npm run dev
```

## Token-key (colaboradores)

No painel: **Convites** → cria username + token.  
Colaborador ativa em **interno** e depois faz login na **plataforma** com CPF.

## API de integração

No painel: **API** → gera `token_temp` → outro sistema troca por `token_perm` (`POST /api/auth/api-tokens/trocar/`) → usa `Authorization: Bearer um_...`.

Variáveis sugeridas no sistema externo:

```env
UNIVERSIDADE_API_URL=https://universidade.moneypromotora.com.br/api
UNIVERSIDADE_API_TOKEN=um_...
```

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/docker.md](docs/docker.md)
