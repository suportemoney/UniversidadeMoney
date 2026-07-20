#!/bin/bash
# Emite certificados Let's Encrypt para os novos subdomínios (VPS).
# Uso (na VPS, dentro do repo):
#   bash deploy/scripts/issue-ssl-certs.sh          # só produção
#   bash deploy/scripts/issue-ssl-certs.sh all      # prod + hml
#   bash deploy/scripts/issue-ssl-certs.sh hml      # só homolog
set -euo pipefail

TARGET="${1:-prod}"
REPO="${DEPLOY_REPO:-/var/www/universidade/repo}"
cd "$REPO"

ENV_FILE=".env.production"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DOMAIN_INTERNO="${DOMAIN_INTERNO:-interno.moneypromotora.com.br}"
DOMAIN_PLATAFORMA="${DOMAIN_PLATAFORMA:-plataforma.moneypromotora.com.br}"
DOMAIN_PAINEL="${DOMAIN_PAINEL:-painel-interno.moneypromotora.com.br}"
DOMAIN_INTERNO_HML="${DOMAIN_INTERNO_HML:-interno-hml.moneypromotora.com.br}"
DOMAIN_PLATAFORMA_HML="${DOMAIN_PLATAFORMA_HML:-plataforma-hml.moneypromotora.com.br}"
DOMAIN_PAINEL_HML="${DOMAIN_PAINEL_HML:-painel-interno-hml.moneypromotora.com.br}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@moneypromotora.com.br}"

DOMAINS=()
case "$TARGET" in
  prod)
    DOMAINS=("$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL")
    ;;
  hml)
    DOMAINS=("$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML")
    ;;
  all)
    DOMAINS=(
      "$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL"
      "$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML"
    )
    ;;
  *)
    echo "Uso: $0 [prod|hml|all]"
    exit 1
    ;;
esac

echo "==> Liberando 80/443 para o gateway Docker..."
# Site legado do host compete com o certificado errado (ERR_CERT_COMMON_NAME_INVALID)
if [ -f /etc/nginx/sites-enabled/universidade ]; then
  sudo rm -f /etc/nginx/sites-enabled/universidade
  echo "    removido sites-enabled/universidade"
fi
if systemctl is-active --quiet nginx 2>/dev/null; then
  # Se o nginx do host ainda escuta 80/443, para para o Docker assumir
  if sudo ss -tulpn 2>/dev/null | grep -E ':80 |:443 ' | grep -q nginx; then
    echo "    parando nginx do host (portas 80/443 em uso)"
    sudo systemctl stop nginx || true
  fi
fi

COMPOSE=(docker compose -f compose.yml -f compose.vps.yml --env-file .env.production)

echo "==> Subindo gateway (bootstrap HTTP se ainda sem certs)..."
"${COMPOSE[@]}" up -d --build gateway db certbot \
  frontend-interno-prod frontend-plataforma-prod frontend-painel-prod \
  backend-prod 2>/dev/null || "${COMPOSE[@]}" up -d gateway

# Garante volume ACME gravável
"${COMPOSE[@]}" exec -T gateway sh -c 'mkdir -p /var/www/certbot && chmod -R 755 /var/www/certbot' 2>/dev/null || true

echo "==> Emitindo certificados..."
for d in "${DOMAINS[@]}"; do
  echo "---- $d ----"
  "${COMPOSE[@]}" run --rm --entrypoint certbot \
    -e CERTBOT_EMAIL="$CERTBOT_EMAIL" \
    certbot certonly --webroot -w /var/www/certbot \
      --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive \
      -d "$d" || {
        echo "AVISO: falha em $d (DNS aponta para esta VPS? porta 80 livre?)"
        continue
      }
done

echo "==> Recriando gateway com HTTPS onde houver certificado..."
"${COMPOSE[@]}" up -d --force-recreate gateway

echo ""
echo "Concluído. Teste:"
for d in "${DOMAINS[@]}"; do
  echo "  curl -I https://$d/"
done
echo ""
echo "Se ainda aparecer certificado errado: confirme DNS A → IP desta VPS e que só o container gateway escuta 443."
