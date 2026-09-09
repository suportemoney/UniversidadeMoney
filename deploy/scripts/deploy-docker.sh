#!/bin/bash
# Deploy Docker — UniversidadeMoney (VPS)
# Edge = nginx Docker do EducaMoney (80/443). Nossos containers só em 127.0.0.1.
# Não altera default.conf nem compose do EducaMoney.
set -euo pipefail

BASE="${DEPLOY_BASE:-/var/www/universidade}"
REPO="${DEPLOY_REPO:-$BASE/repo}"
ENV_FILE=".env"
DOMAIN="${VPS_DOMAIN:-universidade.moneypromotora.com.br}"
SERVICES="backend-prod frontend-interno-prod frontend-plataforma-prod frontend-painel-prod"

cd "$REPO"

echo "==> Atualizando código (main)..."
if [ "${DEPLOY_SKIP_GIT:-0}" = "1" ]; then
  echo "==> Git já atualizado pelo GitHub Action — pulando fetch."
else
  git remote prune origin 2>/dev/null || true
  git fetch origin 2>/dev/null || true
  git checkout main 2>/dev/null || git checkout -b main "origin/main"
  git reset --hard "origin/main"
fi
git clean -fd -e .env -e .env.production -e .env.homolog -e .env.development

find docker deploy -type f \( -name "*.sh" \) -exec sed -i 's/\r$//' {} + 2>/dev/null || true

if [ ! -f "$REPO/.env" ]; then
  echo "ERRO: faltando $REPO/.env (criar a partir de .env.exemple na VPS; não versionar)."
  exit 1
fi

# Garante hosts/CORS do domínio único (evita Django DisallowedHost)
ensure_django_hosts() {
  local envf="$1"
  local hosts="$2"
  local origins="$3"
  [ -f "$envf" ] || return 0

  upsert_env() {
    local key="$1"
    local val="$2"
    if grep -q "^${key}=" "$envf"; then
      local atual
      atual=$(grep -E "^${key}=" "$envf" | head -1 | cut -d= -f2-)
      local precisa=0
      local parte
      IFS=',' read -ra partes <<< "$val"
      for parte in "${partes[@]}"; do
        parte=$(echo "$parte" | tr -d ' ')
        [ -z "$parte" ] && continue
        case ",$atual," in
          *",$parte,"*) ;;
          *) precisa=1; break ;;
        esac
      done
      if [ "$precisa" = "1" ]; then
        echo "==> Atualizando $key em $envf (hosts/origins incompletos)"
        sed -i "s|^${key}=.*|${key}=${val}|" "$envf"
      fi
    else
      echo "==> Adicionando $key em $envf"
      echo "${key}=${val}" >> "$envf"
    fi
  }

  upsert_env "ALLOWED_HOSTS" "$hosts"
  upsert_env "DJANGO_ALLOWED_HOSTS" "$hosts"
  upsert_env "CSRF_TRUSTED_ORIGINS" "$origins"
  upsert_env "CORS_ALLOWED_ORIGINS" "$origins"
  upsert_env "FRONTEND_ORIGINS" "$origins"
}

# Lê domínio do .env da VPS se existir
if grep -q '^VPS_DOMAIN=' "$REPO/.env"; then
  DOMAIN=$(grep -E '^VPS_DOMAIN=' "$REPO/.env" | head -1 | cut -d= -f2- | tr -d '\r')
fi

ensure_django_hosts \
  "$REPO/.env" \
  "${DOMAIN},backend,nginx,localhost" \
  "https://${DOMAIN}"

# Sem Docker: fallback legado (não mexe no nginx de outros projetos)
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "==> Docker indisponível — fallback legado"
  sed -i 's/\r$//' deploy/scripts/deploy.sh 2>/dev/null || true
  bash deploy/scripts/deploy.sh
  exit 0
fi

mkdir -p "$BASE/static" "$BASE/media"

# Libera 7101 do gunicorn legado (systemd) — NÃO mexe no nginx do host
if systemctl list-unit-files 2>/dev/null | grep -q universidade-backend; then
  echo "==> Parando gunicorn legado (universidade-backend) para liberar 7101..."
  sudo systemctl stop universidade-backend 2>/dev/null || true
  sudo systemctl disable universidade-backend 2>/dev/null || true
fi

echo "==> Build e up containers (prod) — só 127.0.0.1..."
docker compose \
  -f compose.yml \
  -f compose.vps.yml \
  --env-file "$ENV_FILE" \
  up -d --build --remove-orphans \
  db $SERVICES

# Edge = nginx Docker do EducaMoney (80/443). Não instalamos nginx no host e não editamos default.conf.
EDGE_NGINX="${EDGE_NGINX_CONTAINER:-educamoney_nginx}"
UM_NET="${COMPOSE_PROJECT_NAME:-universidade-money}_universidade"

echo "==> Injetando server_name ${DOMAIN} no ${EDGE_NGINX} (sem alterar EducaMoney)..."
if docker inspect "$EDGE_NGINX" >/dev/null 2>&1; then
  docker network connect "$UM_NET" "$EDGE_NGINX" 2>/dev/null || true
  if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    CONF_SRC="$REPO/deploy/nginx/universidade-sites.conf"
  else
    CONF_SRC="$REPO/deploy/nginx/universidade-sites-bootstrap.conf"
  fi
  docker cp "$CONF_SRC" "$EDGE_NGINX:/etc/nginx/conf.d/universidade.conf"
  docker exec "$EDGE_NGINX" nginx -t
  docker exec "$EDGE_NGINX" nginx -s reload
  echo "==> nginx do EducaMoney recarregado com universidade.conf"
else
  echo "ERRO: container ${EDGE_NGINX} não encontrado — 80/443 está com outro processo?"
  exit 1
fi

echo "==> Status containers..."
docker compose -f compose.yml -f compose.vps.yml --env-file "$ENV_FILE" ps

echo "Deploy Docker (prod) concluído. Edge = ${EDGE_NGINX}. Domínio = ${DOMAIN}"
