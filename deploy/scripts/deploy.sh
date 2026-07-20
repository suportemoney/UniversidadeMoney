#!/bin/bash
# [LEGADO] Deploy com venv + systemd + nginx do host.
# Preferir: deploy/scripts/deploy-docker.sh
# Mantido temporariamente para rollback durante a migração.
set -e

BASE=/var/www/universidade
REPO=$BASE/repo
VENV=$BASE/venv

echo "==> [LEGADO] Atualizando código..."
cd "$REPO"
git remote prune origin 2>/dev/null || true
git fetch origin main 2>/dev/null || git fetch origin +main:refs/remotes/origin/main
git reset --hard origin/main
git clean -fd

echo "==> [LEGADO] Backend..."
source "$VENV/bin/activate"
pip install -r backend/requirements.txt

cd "$REPO/backend"
python manage.py migrate --noinput
python manage.py collectstatic --noinput

sudo systemctl restart universidade-backend

echo "==> [LEGADO] Frontend..."
cd "$REPO/frontend"

if [ ! -f .env.production ]; then
  cp .env.example .env.production
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

sudo rm -rf "$BASE/frontend-dist"/*
sudo cp -r dist/* "$BASE/frontend-dist/"
sudo chown -R www-data:www-data "$BASE/frontend-dist"

echo "==> [LEGADO] nginx..."
NGINX_SITE="/etc/nginx/sites-available/universidade"
if [ -f "$REPO/deploy/nginx/universidade.conf" ]; then
  sudo cp "$REPO/deploy/nginx/universidade.conf" "$NGINX_SITE"
  sudo ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/universidade 2>/dev/null || true
fi
sudo nginx -t
# Se o serviço estiver parado (ex.: após liberar 443 para Docker), sobe de novo
if systemctl is-active --quiet nginx; then
  sudo systemctl reload nginx
else
  sudo systemctl start nginx
fi

echo "Deploy legado concluído. Migre para deploy-docker.sh quando possível."
