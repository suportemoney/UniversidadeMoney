# UniversidadeMoney

Monorepo **Django + DRF** (backend) e **React + Vite** (frontend), executado com **Docker** em três ambientes: desenvolvimento, homologação e produção.

## Stack

- PostgreSQL (container)
- Python + Django + DRF + Gunicorn
- React + Vite
- nginx + certbot (VPS)

## Ambientes

| Ambiente | Como sobe | Domínio |
|----------|-----------|---------|
| development | `compose.dev.yml` no Windows | localhost |
| homologation | `compose.vps.yml` + branch `homolog` | `universidade-hml.moneypromotora.com.br` |
| production | `compose.vps.yml` + branch `main` | `universidade.moneypromotora.com.br` |

Bancos separados: `universidade_money_dev` / `universidade_money_hml` / `universidade_money`.

## Estrutura

```
backend/          # API Django + DRF
frontend/         # SPA React (Vite)
docker/           # imagens, nginx, entrypoints
compose*.yml      # orquestração por ambiente
deploy/           # scripts de deploy
docs/             # guias operacionais
```

## Desenvolvimento local (Windows)

```bash
cp .env.development.example .env.development
docker compose -f compose.yml -f compose.dev.yml --env-file .env.development up --build
```

- Front: http://localhost:5173  
- API (direto): http://localhost:8000  
- Proxy nginx opcional: http://localhost:8080  

## Variáveis de ambiente

Modelos no Git (sem segredos):

- `.env.development.example`
- `.env.homolog.example`
- `.env.production.example`

Na VPS: copiar para `.env.homolog` e `.env.production` dentro do clone do repositório.

## Deploy

- Push `main` → produção (Docker)
- Push `homolog` → homologação (Docker)

Guia: [docs/docker.md](docs/docker.md) · Arquitetura: [ARCHITECTURE.md](ARCHITECTURE.md)
