# Docker — UniversidadeMoney

Guia operacional do stack containerizado (dev / homolog / prod).

## Pré-requisitos

- Docker Desktop (Windows) ou Docker Engine + Compose v2 (VPS)
- Arquivos `.env.*` a partir dos exemplos na raiz do repo

## Desenvolvimento local

```bash
cp .env.development.example .env.development
docker compose -f compose.yml -f compose.dev.yml --env-file .env.development up --build
```

| Serviço | URL |
|---------|-----|
| Vite | http://localhost:5173 |
| Django | http://localhost:8000 |
| nginx (proxy) | http://localhost:8080 |
| Postgres (host) | localhost:5433 |

Hot-reload: volumes montam `backend/` e `frontend/`.

Parar:

```bash
docker compose -f compose.yml -f compose.dev.yml --env-file .env.development down
```

## VPS — primeira instalação

1. DNS A para:
   - `universidade.moneypromotora.com.br`
   - `universidade-hml.moneypromotora.com.br`
2. Instalar Docker + Compose na VPS.
3. Clonar o repo em `/var/www/universidade/repo`.
4. Criar env files:

```bash
cd /var/www/universidade/repo
cp .env.production.example .env.production
cp .env.homolog.example .env.homolog
# editar SECRET_KEY, senhas, e-mail certbot
```

5. Subir stack (modo bootstrap HTTP até haver certificados):

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production up -d --build
```

6. Emitir SSL:

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production --profile init run --rm certbot-init
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production up -d --force-recreate gateway
```

7. Desativar stack legado (systemd + nginx do host) quando o gateway Docker estiver ok:

```bash
sudo systemctl stop universidade-backend
sudo systemctl disable universidade-backend
sudo rm -f /etc/nginx/sites-enabled/universidade
sudo systemctl reload nginx   # ou stop se não houver outros sites
```

## Deploy contínuo

```bash
bash deploy/scripts/deploy-docker.sh prod   # branch main
bash deploy/scripts/deploy-docker.sh hml    # branch homolog
```

GitHub Actions:

- [`.github/workflows/deploy-main.yml`](../.github/workflows/deploy-main.yml) → prod
- [`.github/workflows/deploy-homolog.yml`](../.github/workflows/deploy-homolog.yml) → hml

## Separação prod vs homolog

| | Produção | Homologação |
|--|----------|-------------|
| Branch | `main` | `homolog` |
| Env file | `.env.production` | `.env.homolog` |
| Serviço API | `backend-prod` | `backend-hml` |
| Frontend | `frontend-prod` | `frontend-hml` |
| Database | `universidade_money` | `universidade_money_hml` |
| Domínio | `universidade.moneypromotora.com.br` | `universidade-hml.moneypromotora.com.br` |

Um único Postgres; databases distintos. Um único nginx gateway roteia por `server_name`.

## Migração de dados (host → Docker)

Ver [docker-migrate.md](docker-migrate.md).

## Troubleshooting

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production ps
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production logs -f backend-prod
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production logs -f gateway
```

Certificados ausentes → gateway fica em modo bootstrap (HTTP). Rode `certbot-init` e recrie o gateway.
