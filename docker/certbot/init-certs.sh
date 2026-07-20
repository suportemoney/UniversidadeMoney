#!/bin/sh
# Emite certificados (usado pelo profile compose "init").
# Preferir na VPS: bash deploy/scripts/issue-ssl-certs.sh
set -e

DOMAIN_INTERNO="${DOMAIN_INTERNO:-interno.moneypromotora.com.br}"
DOMAIN_PLATAFORMA="${DOMAIN_PLATAFORMA:-plataforma.moneypromotora.com.br}"
DOMAIN_PAINEL="${DOMAIN_PAINEL:-painel-interno.moneypromotora.com.br}"
DOMAIN_INTERNO_HML="${DOMAIN_INTERNO_HML:-interno-hml.moneypromotora.com.br}"
DOMAIN_PLATAFORMA_HML="${DOMAIN_PLATAFORMA_HML:-plataforma-hml.moneypromotora.com.br}"
DOMAIN_PAINEL_HML="${DOMAIN_PAINEL_HML:-painel-interno-hml.moneypromotora.com.br}"
EMAIL="${CERTBOT_EMAIL:-admin@moneypromotora.com.br}"
SCOPE="${CERT_SCOPE:-prod}"

case "$SCOPE" in
  hml)
    set -- "$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML"
    ;;
  all)
    set -- "$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL" \
      "$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML"
    ;;
  *)
    set -- "$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL"
    ;;
esac

for d in "$@"; do
  echo "==> Emitindo certificado para $d"
  certbot certonly --webroot -w /var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email --non-interactive \
    -d "$d" || echo "AVISO: falha em $d"
done

echo "Certificados processados. Recrie o gateway."
