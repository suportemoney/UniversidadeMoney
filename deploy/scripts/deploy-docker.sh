#!/bin/bash
# Deploy Docker — UniversidadeMoney (VPS)
# nginx do HOST faz edge; containers só em 127.0.0.1 (não ocupa 80/443).
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
  SERVICES="backend-prod frontend-interno-prod frontend-plataforma-prod frontend-painel-prod"
elif [ "$TARGET" = "hml" ]; then
  BRANCH="homolog"
  ENV_FILE=".env.homolog"
  SERVICES="backend-hml frontend-interno-hml frontend-plataforma-hml frontend-painel-hml"
else
  echo "Alvo inválido: $TARGET (use prod ou hml)"
  exit 1
fi

git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd -e .env.production -e .env.homolog -e .env.development

find docker deploy -type f \( -name "*.sh" \) -exec sed -i 's/\r$//' {} + 2>/dev/null || true

ensure_env_file() {
  local dest="$1"
  local app_env="$2"
  if [ -f "$REPO/$dest" ]; then
    return 0
  fi
  if [ -f "$BASE/.env" ]; then
    echo "==> Gerando $dest a partir de $BASE/.env (legado)..."
    cp "$BASE/.env" "$REPO/$dest"
    if grep -q '^DB_HOST=' "$REPO/$dest"; then
      sed -i 's/^DB_HOST=.*/DB_HOST=db/' "$REPO/$dest"
    else
      echo "DB_HOST=db" >> "$REPO/$dest"
    fi
    if ! grep -q '^APP_ENV=' "$REPO/$dest"; then
      echo "APP_ENV=$app_env" >> "$REPO/$dest"
    fi
    if ! grep -q '^POSTGRES_USER=' "$REPO/$dest"; then
      DB_USER_VAL=$(grep -E '^DB_USER=' "$REPO/$dest" | head -1 | cut -d= -f2- || echo "universidade_user")
      DB_PASS_VAL=$(grep -E '^DB_PASSWORD=' "$REPO/$dest" | head -1 | cut -d= -f2- || echo "")
      DB_NAME_VAL=$(grep -E '^DB_NAME=' "$REPO/$dest" | head -1 | cut -d= -f2- || echo "universidade_money")
      {
        echo "POSTGRES_USER=${DB_USER_VAL}"
        echo "POSTGRES_PASSWORD=${DB_PASS_VAL}"
        echo "POSTGRES_DB=${DB_NAME_VAL}"
      } >> "$REPO/$dest"
    fi
    if ! grep -q '^STATIC_ROOT=' "$REPO/$dest"; then
      echo "STATIC_ROOT=/data/static" >> "$REPO/$dest"
    fi
    if ! grep -q '^MEDIA_ROOT=' "$REPO/$dest"; then
      echo "MEDIA_ROOT=/data/media" >> "$REPO/$dest"
    fi
    return 0
  fi
  echo "ERRO: faltando $REPO/$dest"
  exit 1
}

if [ "$TARGET" = "prod" ]; then
  ensure_env_file ".env.production" "production"
else
  ensure_env_file ".env.homolog" "homologation"
  ensure_env_file ".env.production" "production"
fi

# Garante hosts/CORS dos 3 fronts (evita Django DisallowedHost → HTTP 400 no login)
ensure_django_hosts() {
  local envf="$1"
  local hosts="$2"
  local origins="$3"
  [ -f "$envf" ] || return 0

  upsert_env() {
    local key="$1"
    local val="$2"
    if grep -q "^${key}=" "$envf"; then
      # Só completa se faltar algum host/origin esperado
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
  upsert_env "CSRF_TRUSTED_ORIGINS" "$origins"
  upsert_env "CORS_ALLOWED_ORIGINS" "$origins"
  upsert_env "FRONTEND_ORIGINS" "$origins"
}

if [ "$TARGET" = "prod" ]; then
  ensure_django_hosts \
    "$REPO/.env.production" \
    "interno.moneypromotora.com.br,plataforma.moneypromotora.com.br,painel-interno.moneypromotora.com.br" \
    "https://interno.moneypromotora.com.br,https://plataforma.moneypromotora.com.br,https://painel-interno.moneypromotora.com.br"
else
  ensure_django_hosts \
    "$REPO/.env.homolog" \
    "interno-hml.moneypromotora.com.br,plataforma-hml.moneypromotora.com.br,painel-interno-hml.moneypromotora.com.br" \
    "https://interno-hml.moneypromotora.com.br,https://plataforma-hml.moneypromotora.com.br,https://painel-interno-hml.moneypromotora.com.br"
fi

COMPOSE_ENV=".env.production"

# Sem Docker: legado (não mexe no nginx de outros projetos além do site universidade)
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "==> Docker indisponível — fallback legado"
  sed -i 's/\r$//' deploy/scripts/deploy.sh 2>/dev/null || true
  bash deploy/scripts/deploy.sh
  exit 0
fi

mkdir -p "$BASE/static" "$BASE/media" "$BASE/static-hml" "$BASE/media-hml"

# Libera 7101/7102 do gunicorn legado (systemd) — NÃO mexe no nginx do host
if systemctl list-unit-files 2>/dev/null | grep -q universidade-backend; then
  echo "==> Parando gunicorn legado (universidade-backend) para liberar 7101..."
  sudo systemctl stop universidade-backend 2>/dev/null || true
  sudo systemctl disable universidade-backend 2>/dev/null || true
fi

echo "==> Build e up containers ($TARGET) — só 127.0.0.1..."
docker compose \
  -f compose.yml \
  -f compose.vps.yml \
  --env-file "$COMPOSE_ENV" \
  up -d --build --remove-orphans \
  db $SERVICES

echo "==> Atualizando nginx do HOST (sem parar o serviço)..."
if [ -f "$REPO/deploy/nginx/universidade-sites.conf" ]; then
  # Se ainda não há certs, usa bootstrap HTTP
  if [ -f /etc/letsencrypt/live/interno.moneypromotora.com.br/fullchain.pem ]; then
    sudo cp "$REPO/deploy/nginx/universidade-sites.conf" /etc/nginx/sites-available/universidade-sites
  else
    sudo cp "$REPO/deploy/nginx/universidade-sites-bootstrap.conf" /etc/nginx/sites-available/universidade-sites
  fi
  sudo ln -sf /etc/nginx/sites-available/universidade-sites /etc/nginx/sites-enabled/universidade-sites
fi

# Garante nginx rodando (nunca systemctl stop)
sudo systemctl start nginx 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx

echo "==> Status containers..."
docker compose -f compose.yml -f compose.vps.yml --env-file "$COMPOSE_ENV" ps

echo "Deploy Docker ($TARGET) concluído. Edge = nginx do host."
