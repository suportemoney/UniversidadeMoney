# UniversidadeMoney

Sistema desenvolvido em monorepo: **Django + DRF** (backend) e **React + Vite** (frontend).

A execução em produção ocorre na VPS; o ambiente local é usado para edição de código.

## Stack

- PostgreSQL
- Python + Django + Django REST Framework
- React + Vite (build estático)
- nginx + gunicorn + systemd (VPS)

## Estrutura

```
backend/          # API Django + DRF
frontend/         # SPA React (Vite)
deploy/           # nginx, systemd e scripts de deploy
docs/             # guias operacionais da VPS
.github/          # CI/CD (deploy na main)
ARCHITECTURE.md   # visão geral da arquitetura
```

## Documentação

- [ARCHITECTURE.md](ARCHITECTURE.md) — arquitetura e portas (gunicorn **7101**)
- [docs/README.md](docs/README.md) — guias da VPS (PostgreSQL, backend, frontend, nginx, deploy)

## Variáveis de ambiente

Modelos (sem segredos):

- `backend/.env.example`
- `frontend/.env.example`

O `.env` real fica **somente na VPS** (`/var/www/universidade/.env`).

## Deploy

Push na branch `main` dispara deploy via GitHub Actions (SSH na VPS).

Script manual: `deploy/scripts/deploy.sh`

Domínio: `https://universidade.moneypromotora.com.br`

## Próximos passos na VPS

1. Criar banco PostgreSQL — [docs/postgresql-vps.md](docs/postgresql-vps.md)
2. Configurar backend — [docs/backend-vps.md](docs/backend-vps.md)
3. Build do frontend — [docs/frontend-vps.md](docs/frontend-vps.md)
4. Configurar nginx — [docs/nginx-vps.md](docs/nginx-vps.md)
