#!/bin/bash
# Deploy idempotente — UniversidadeMoney (VPS)
set -e

BASE=/var/www/universidade
REPO=$BASE/repo
VENV=$BASE/venv

echo "==> Atualizando código..."
cd "$REPO"
git pull origin main

echo "==> Backend..."
source "$VENV/bin/activate"
pip install -r backend/requirements.txt

cd "$REPO/backend"
# Django carrega /var/www/universidade/.env via config/settings/base.py
python manage.py migrate --noinput
python manage.py collectstatic --noinput

sudo systemctl restart universidade-backend

echo "==> Frontend..."
cd "$REPO/frontend"

# Garante variáveis de build de produção
if [ ! -f .env.production ]; then
  cp .env.example .env.production
fi

npm ci
npm run build

sudo rm -rf "$BASE/frontend-dist"/*
sudo cp -r dist/* "$BASE/frontend-dist/"
sudo chown -R www-data:www-data "$BASE/frontend-dist"

echo "==> nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "Deploy concluído."
