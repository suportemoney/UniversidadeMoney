#!/bin/sh
# Emite certificados iniciais (rodar uma vez na VPS com gateway em modo bootstrap).
# Uso:
#   docker compose -f compose.yml -f compose.vps.yml --env-file .env.production run --rm certbot-init
set -e

DOMAIN_PROD="${DOMAIN_PROD:-universidade.moneypromotora.com.br}"
DOMAIN_HML="${DOMAIN_HML:-universidade-hml.moneypromotora.com.br}"
EMAIL="${CERTBOT_EMAIL:-admin@moneypromotora.com.br}"

certbot certonly --webroot -w /var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN_PROD"

certbot certonly --webroot -w /var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN_HML"

echo "Certificados emitidos. Reinicie o gateway: docker compose ... up -d gateway --force-recreate"
