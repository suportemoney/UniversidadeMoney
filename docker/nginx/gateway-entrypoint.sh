#!/bin/bash
set -e

DOMAIN_INTERNO="${DOMAIN_INTERNO:-interno.moneypromotora.com.br}"
DOMAIN_PLATAFORMA="${DOMAIN_PLATAFORMA:-plataforma.moneypromotora.com.br}"
DOMAIN_PAINEL="${DOMAIN_PAINEL:-painel-interno.moneypromotora.com.br}"
DOMAIN_INTERNO_HML="${DOMAIN_INTERNO_HML:-interno-hml.moneypromotora.com.br}"
DOMAIN_PLATAFORMA_HML="${DOMAIN_PLATAFORMA_HML:-plataforma-hml.moneypromotora.com.br}"
DOMAIN_PAINEL_HML="${DOMAIN_PAINEL_HML:-painel-interno-hml.moneypromotora.com.br}"

export DOMAIN_INTERNO DOMAIN_PLATAFORMA DOMAIN_PAINEL
export DOMAIN_INTERNO_HML DOMAIN_PLATAFORMA_HML DOMAIN_PAINEL_HML

ENV_VARS='${DOMAIN_INTERNO} ${DOMAIN_PLATAFORMA} ${DOMAIN_PAINEL} ${DOMAIN_INTERNO_HML} ${DOMAIN_PLATAFORMA_HML} ${DOMAIN_PAINEL_HML}'

all_certs=true
for d in "$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL" "$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML"; do
  if [ ! -f "/etc/letsencrypt/live/${d}/fullchain.pem" ]; then
    all_certs=false
    break
  fi
done

if [ "$all_certs" = true ]; then
  echo "==> Certificados OK — modo HTTPS"
  envsubst "$ENV_VARS" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "==> Certificados ausentes — modo bootstrap HTTP"
  envsubst "$ENV_VARS" < /etc/nginx/templates/gateway-bootstrap.conf.template > /etc/nginx/conf.d/default.conf
fi

exec "$@"
