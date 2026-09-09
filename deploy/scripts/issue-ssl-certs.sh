#!/bin/bash
# Emite SSL via certbot webroot (nginx do EducaMoney já serve /.well-known).
# Não para o nginx e não altera default.conf do EducaMoney.
# Uso: bash deploy/scripts/issue-ssl-certs.sh
set -euo pipefail

REPO="${DEPLOY_REPO:-/var/www/universidade/repo}"
cd "$REPO"

DOMAIN="${VPS_DOMAIN:-universidade.moneypromotora.com.br}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@moneypromotora.com.br}"
EDGE_NGINX="${EDGE_NGINX_CONTAINER:-educamoney_nginx}"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  DOMAIN="${VPS_DOMAIN:-$DOMAIN}"
  CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@moneypromotora.com.br}"
fi

echo "==> Garantindo desafio ACME em /var/www/certbot..."
sudo mkdir -p /var/www/certbot

if ! command -v certbot >/dev/null 2>&1; then
  echo "Instalando certbot..."
  sudo apt-get update -y
  sudo apt-get install -y certbot
fi

echo "==> Emitindo certificado (webroot, sem parar 80/443)..."
sudo certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" \
  --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive \
  || echo "AVISO: falha em $DOMAIN (DNS A → esta VPS?)"

if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo "ERRO: certificado ainda não existe em /etc/letsencrypt/live/${DOMAIN}/"
  exit 1
fi

echo "==> Aplicando conf HTTPS no ${EDGE_NGINX}..."
docker cp "$REPO/deploy/nginx/universidade-sites.conf" "$EDGE_NGINX:/etc/nginx/conf.d/universidade.conf"
docker exec "$EDGE_NGINX" nginx -t
docker exec "$EDGE_NGINX" nginx -s reload

echo ""
echo "Concluído. EducaMoney permanece no ar."
echo "  curl -I https://${DOMAIN}/"
echo "  curl -I https://${DOMAIN}/interno/"
echo "  curl -I https://${DOMAIN}/painel/"
echo "  curl -I https://${DOMAIN}/api/"
