#!/bin/bash
# Gera conf nginx; se ainda não houver certificado, usa modo bootstrap (só HTTP).
set -e

DOMAIN_PROD="${DOMAIN_PROD:-universidade.moneypromotora.com.br}"
DOMAIN_HML="${DOMAIN_HML:-universidade-hml.moneypromotora.com.br}"

CERT_PROD="/etc/letsencrypt/live/${DOMAIN_PROD}/fullchain.pem"
CERT_HML="/etc/letsencrypt/live/${DOMAIN_HML}/fullchain.pem"

export DOMAIN_PROD DOMAIN_HML

if [ -f "$CERT_PROD" ] && [ -f "$CERT_HML" ]; then
  echo "==> Certificados encontrados — modo HTTPS completo"
  envsubst '${DOMAIN_PROD} ${DOMAIN_HML}' \
    < /etc/nginx/templates/default.conf.template \
    > /etc/nginx/conf.d/default.conf
else
  echo "==> Certificados ausentes — modo bootstrap HTTP (emita SSL com certbot)"
  envsubst '${DOMAIN_PROD} ${DOMAIN_HML}' \
    < /etc/nginx/templates/gateway-bootstrap.conf.template \
    > /etc/nginx/conf.d/default.conf
fi

exec "$@"
