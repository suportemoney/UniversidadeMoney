---
name: universidade-deploy-vps
description: Padroniza o deploy Docker do UniversidadeMoney (compose VPS, nginx do host, certbot, Action na main). Use ao criar/ajustar compose, docker/, deploy/scripts e workflows.
disable-model-invocation: true
---

# UniversidadeMoney — Deploy Docker na VPS

## Alvo

| Ambiente | Domínio | Branch | Script |
|----------|---------|--------|--------|
| production | `universidade.moneypromotora.com.br` | `main` | `deploy-docker.sh` |

Caminhos: `/` plataforma, `/interno` interno, `/painel` painel, `/api` Django.

nginx Docker do **EducaMoney** termina TLS. Docker do Universidade só em `127.0.0.1:7101+`. Não editar `default.conf` do EducaMoney.

## Compose

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env up -d --build
```

Env na VPS (fora do Git): `/var/www/universidade/repo/.env`

## Banco

Um Postgres Docker; database `universidade_money`.

## SSL

`bash deploy/scripts/issue-ssl-certs.sh` (certbot do host, um domínio).

## Actions

- `deploy-main.yml` → prod (push `main`)
- Secrets: `VPS_HOST`, `VPS_USER`, `VPS_PORT`, `VPS_PASSWORD`

## Docs

- `docs/docker.md`
- `docs/github-actions-vps.md`
