# Deploy na VPS — UniversidadeMoney

Guia para deploy inicial, atualizações e verificação do sistema completo.

## Ordem recomendada (primeira vez)

1. [postgresql-vps.md](postgresql-vps.md) — banco e usuário
2. [backend-vps.md](backend-vps.md) — venv, migrations, gunicorn, systemd
3. [frontend-vps.md](frontend-vps.md) — build e publicação do React
4. [nginx-vps.md](nginx-vps.md) — proxy, SSL, rotas
5. [github-actions-vps.md](github-actions-vps.md) — deploy automático na `main`

---

## Deploy automático (GitHub Actions)

Ver guia completo: [github-actions-vps.md](github-actions-vps.md)

Resumo:

1. Commitar `frontend/package-lock.json` no repositório
2. Criar secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
3. Na VPS: `chmod +x /var/www/universidade/repo/deploy/scripts/deploy.sh`
4. Push na `main` dispara o workflow

---

## Checklist pós-deploy

```bash
# PostgreSQL
sudo ss -tulpn | grep 5432

# Gunicorn (UniversidadeMoney)
sudo ss -tulpn | grep 7101
sudo systemctl status universidade-backend

# nginx
sudo systemctl status nginx
curl -I https://universidade.moneypromotora.com.br/
curl -I https://universidade.moneypromotora.com.br/api/
```

---

## Deploy manual completo

Script de referência (executar na VPS):

```bash
#!/bin/bash
set -e

BASE=/var/www/universidade
REPO=$BASE/repo

cd $REPO
git pull origin main

# Backend
source $BASE/venv/bin/activate
pip install -r backend/requirements.txt
cd backend
set -a && source $BASE/.env && set +a
python manage.py migrate --noinput
python manage.py collectstatic --noinput
sudo systemctl restart universidade-backend

# Frontend
cd $REPO/frontend
npm ci
npm run build
sudo rm -rf $BASE/frontend-dist/*
sudo cp -r dist/* $BASE/frontend-dist/
sudo chown -R www-data:www-data $BASE/frontend-dist

# nginx
sudo nginx -t
sudo systemctl reload nginx

echo "Deploy concluído."
```

Salvar futuramente em `deploy/scripts/deploy.sh` no repositório.

---

## Deploy automatizado (GitHub Actions)

Fluxo alvo:

```
push main → GitHub Actions → SSH na VPS → deploy/scripts/deploy.sh
```

Detalhes: [github-actions-vps.md](github-actions-vps.md)

Secrets necessários no GitHub:

| Secret | Descrição |
|--------|-----------|
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_USER` | Usuário SSH |
| `VPS_SSH_KEY` | Chave privada SSH |

O `.env` permanece **somente na VPS** — não vai para o GitHub.

---

## Portas — referência rápida

| Porta | Serviço | Projeto |
|-------|---------|---------|
| 7101 | Gunicorn | **UniversidadeMoney** |
| 7102 | Reservada | UniversidadeMoney (futuro) |
| 5432 | PostgreSQL | Compartilhado (banco `universidade_money`) |
| 9001 | Gunicorn | **Outro projeto** — não usar |
| 80/443 | nginx | Compartilhado |

---

## Reiniciar tudo (emergência)

```bash
sudo systemctl restart postgresql
sudo systemctl restart universidade-backend
sudo systemctl reload nginx
```

---

## Logs centralizados

```bash
# Backend
sudo journalctl -u universidade-backend -f

# nginx
sudo tail -f /var/log/nginx/error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

---

## Rollback simples

Se um deploy quebrar:

```bash
cd /var/www/universidade/repo
git log --oneline -5
git checkout COMMIT_ANTERIOR_ESTAVEL

# Repetir passos de backend e frontend do deploy manual
sudo systemctl restart universidade-backend
sudo nginx -t && sudo systemctl reload nginx
```

Depois corrigir na `main` e fazer novo deploy.

---

## Troubleshooting geral

| Sintoma | Onde olhar |
|---------|------------|
| Site fora do ar | `systemctl status nginx` |
| API 502 | `systemctl status universidade-backend` + porta 7101 |
| Erro de banco | [postgresql-vps.md](postgresql-vps.md) |
| Front desatualizado | Rebuild + copiar para `frontend-dist/` |
| Admin não abre | `CSRF_TRUSTED_ORIGINS`, SSL, logs do gunicorn |

Visão geral: [ARCHITECTURE.md](../ARCHITECTURE.md)
