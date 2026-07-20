# Docker — UniversidadeMoney

## Dev local

```bash
cp .env.development.example .env.development
docker compose -f compose.yml -f compose.dev.yml --env-file .env.development up --build
```

| Serviço | URL |
|---------|-----|
| Plataforma | http://localhost:5173 |
| Painel | http://localhost:5174 |
| Interno (token) | http://localhost:5175 |
| API | http://localhost:8000 |

## Subdomínios produção

| Host | Container |
|------|-----------|
| `interno.moneypromotora.com.br` | `frontend-interno-prod` |
| `plataforma.moneypromotora.com.br` | `frontend-plataforma-prod` |
| `painel-interno.moneypromotora.com.br` | `frontend-painel-prod` |

Homolog: `interno-hml`, `plataforma-hml`, `painel-interno-hml`.

## VPS

1. DNS A para os 6 hosts
2. `.env.production` e `.env.homolog` a partir dos exemplos
3. `docker compose -f compose.yml -f compose.vps.yml --env-file .env.production up -d --build`
4. Certificados: `--profile init run --rm certbot-init` e recrear `gateway`

Deploy: `deploy/scripts/deploy-docker.sh prod|hml`
