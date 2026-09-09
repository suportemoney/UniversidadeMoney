---
name: universidade-architecture
description: Mantém o contexto da arquitetura Docker do UniversidadeMoney (dev/prod, Django+DRF, React, Compose). Use ao estruturar pastas, settings/env ou explicar front/back/deploy.
disable-model-invocation: true
---

# UniversidadeMoney — Arquitetura (Docker)

## Objetivo

- Código local (Windows) sobe com `compose.dev.yml` e `--env-file .env`.
- VPS sobe só produção com `compose.vps.yml`.
- Segredos só em `.env` (não versionado). Modelo: `.env.exemple`.

## Stack

- PostgreSQL (container)
- Django + DRF + Gunicorn
- React + Vite (HMR no dev; build estático no VPS)
- nginx Docker do EducaMoney na VPS (80/443); UniversidadeMoney só injeta `conf.d/universidade.conf`

## Ambientes

| APP_ENV | Compose | Banco |
|---------|---------|-------|
| development | compose.dev.yml | universidade_money_dev |
| production | compose.vps.yml | universidade_money |

## Estrutura

```
backend/
frontend-plataforma/
frontend-painel/
docker/
compose.yml
compose.dev.yml
compose.vps.yml
.env.exemple
deploy/scripts/deploy-docker.sh
.github/workflows/deploy-main.yml
ARCHITECTURE.md
```

## Contratos (produção)

- `/api/`, `/admin/` → backend
- `/` → plataforma
- `/interno/` → interno
- `/painel/` → painel
- `/static/`, `/media/` → volumes no host

## Deploy

- `main` → produção (GitHub Action SSH)

Detalhes: `ARCHITECTURE.md` e `docs/docker.md`.
