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

## SSL (Let's Encrypt) — novos domínios

O erro `NET::ERR_CERT_COMMON_NAME_INVALID` aparece quando o **nginx antigo do host** ainda responde na 443 com o certificado de `universidade.moneypromotora.com.br`.

### 1. Instalar Docker (obrigatório)

```bash
cd /var/www/universidade/repo
git pull origin main
sed -i 's/\r$//' deploy/scripts/*.sh
bash deploy/scripts/install-docker-vps.sh
```

### 2. Emitir certificados

DNS A dos hosts → IP da VPS, depois:

```bash
bash deploy/scripts/issue-ssl-certs.sh prod
```

Teste: `curl -I https://interno.moneypromotora.com.br/`
