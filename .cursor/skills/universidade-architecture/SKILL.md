---
name: universidade-architecture
description: Mantém o contexto da arquitetura Docker do UniversidadeMoney (dev/homolog/prod, Django+DRF, React, Compose). Use ao estruturar pastas, settings/env ou explicar front/back/deploy.
disable-model-invocation: true
---

# UniversidadeMoney — Arquitetura (Docker)

## Objetivo

- Código local (Windows) sobe com `compose.dev.yml`.
- VPS sobe prod + homolog com `compose.vps.yml`.
- Segredos só em `.env.development` / `.env.homolog` / `.env.production` (não versionados).

## Stack

- PostgreSQL (container)
- Django + DRF + Gunicorn
- React + Vite (HMR no dev; build estático no VPS)
- nginx gateway + certbot na VPS

## Ambientes

| APP_ENV | Compose | Banco |
|---------|---------|-------|
| development | compose.dev.yml | universidade_money_dev |
| homologation | compose.vps.yml (backend-hml) | universidade_money_hml |
| production | compose.vps.yml (backend-prod) | universidade_money |

## Estrutura

```
backend/
frontend/
docker/
compose.yml
compose.dev.yml
compose.vps.yml
.env.*.example
deploy/scripts/deploy-docker.sh
.github/workflows/
ARCHITECTURE.md
```

## Contratos

- `/api/`, `/admin/` → backend do ambiente
- `/` → frontend do ambiente
- `/static/`, `/media/` → volumes Docker

## Deploy

- `main` → prod | `homolog` → hml

Detalhes: `ARCHITECTURE.md` e `docs/docker.md`.
