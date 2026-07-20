# Guias de operação — UniversidadeMoney

Documentação prática do stack **Docker** (caminho padrão) e referências legadas da VPS.

## Docker (atual)

| Guia | Conteúdo |
|------|----------|
| [docker.md](docker.md) | Dev local, VPS, SSL, deploy prod/hml |
| [docker-migrate.md](docker-migrate.md) | Migrar Postgres/media do host para volumes |
| [github-actions-vps.md](github-actions-vps.md) | Actions (branches `main` e `homolog`) |

## Legado (venv / systemd / nginx host)

Mantidos para rollback durante a migração:

| Guia | Conteúdo |
|------|----------|
| [postgresql-vps.md](postgresql-vps.md) | Postgres no host |
| [backend-vps.md](backend-vps.md) | venv, gunicorn, systemd (porta 7101) |
| [frontend-vps.md](frontend-vps.md) | build React no host |
| [nginx-vps.md](nginx-vps.md) | nginx do host + certbot |
| [deploy-vps.md](deploy-vps.md) | deploy legado |

Visão geral: [ARCHITECTURE.md](../ARCHITECTURE.md).
