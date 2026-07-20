---
name: universidade-deploy-vps
description: Padroniza o deploy Docker do UniversidadeMoney (compose VPS, gateway nginx, certbot, Actions main/homolog). Use ao criar/ajustar compose, docker/, deploy/scripts e workflows.
disable-model-invocation: true
---

# UniversidadeMoney — Deploy Docker na VPS

## Alvos

| Ambiente | Domínio | Branch | Script |
|----------|---------|--------|--------|
| production | `universidade.moneypromotora.com.br` | `main` | `deploy-docker.sh prod` |
| homologation | `universidade-hml.moneypromotora.com.br` | `homolog` | `deploy-docker.sh hml` |

Gateway nginx (container) termina TLS e roteia por `server_name` para `backend-prod` / `backend-hml` e frontends estáticos.

## Compose

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production up -d --build
```

Env files na VPS (fora do Git): `.env.production`, `.env.homolog`.

## Bancos

Um Postgres Docker; databases `universidade_money` (prod) e `universidade_money_hml` (hml).

## SSL

Primeira vez: profile `init` + `certbot-init`, depois recrear `gateway`. Renovação via serviço `certbot`.

## Actions

- `deploy-main.yml` → prod
- `deploy-homolog.yml` → hml

## Legado

`deploy.sh` + systemd + nginx host (porta 7101) só para rollback. Preferir Docker.

## Docs

- `docs/docker.md`
- `docs/docker-migrate.md`
- `docs/github-actions-vps.md`
