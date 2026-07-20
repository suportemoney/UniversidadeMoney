#!/bin/bash
# Deploy Docker — UniversidadeMoney (VPS)
# Uso:
#   bash deploy/scripts/deploy-docker.sh prod
#   bash deploy/scripts/deploy-docker.sh hml
set -euo pipefail

TARGET="${1:-prod}"
BASE="${DEPLOY_BASE:-/var/www/universidade}"
REPO="${DEPLOY_REPO:-$BASE/repo}"

cd "$REPO"

echo "==> Atualizando código..."
git remote prune origin 2>/dev/null || true
git fetch origin 2>/dev/null || true

if [ "$TARGET" = "prod" ]; then
  BRANCH="main"
  ENV_FILE=".env.production"
  SERVICES="backend-prod frontend-prod gateway"
elif [ "$TARGET" = "hml" ]; then
  BRANCH="homolog"
  ENV_FILE=".env.homolog"
  SERVICES="backend-hml frontend-hml gateway"
else
  echo "Alvo inválido: $TARGET (use prod ou hml)"
  exit 1
fi

git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd

# Corrige CRLF em scripts (clone no Windows / OneDrive)
find docker deploy -type f \( -name "*.sh" \) -exec sed -i 's/\r$//' {} + 2>/dev/null || true

if [ ! -f "$REPO/$ENV_FILE" ]; then
  echo "ERRO: faltando $REPO/$ENV_FILE (copie a partir do .example correspondente)"
  exit 1
fi

# .env.production também carrega domínios/POSTGRES para o stack compartilhado
COMPOSE_ENV=".env.production"
if [ ! -f "$REPO/$COMPOSE_ENV" ]; then
  COMPOSE_ENV="$ENV_FILE"
fi

echo "==> Build e up ($TARGET)..."
docker compose \
  -f compose.yml \
  -f compose.vps.yml \
  --env-file "$COMPOSE_ENV" \
  up -d --build --remove-orphans \
  db gateway certbot $SERVICES

echo "==> Status..."
docker compose -f compose.yml -f compose.vps.yml --env-file "$COMPOSE_ENV" ps

echo "Deploy Docker ($TARGET) concluído."
