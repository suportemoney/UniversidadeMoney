#!/bin/bash
# Emite SSL via certbot do HOST (nginx compartilhado — NÃO para o nginx).
# Uso: bash deploy/scripts/issue-ssl-certs.sh [prod|hml|all]
set -euo pipefail

TARGET="${1:-prod}"
REPO="${DEPLOY_REPO:-/var/www/universidade/repo}"
cd "$REPO"

DOMAIN_INTERNO="${DOMAIN_INTERNO:-interno.moneypromotora.com.br}"
DOMAIN_PLATAFORMA="${DOMAIN_PLATAFORMA:-plataforma.moneypromotora.com.br}"
DOMAIN_PAINEL="${DOMAIN_PAINEL:-painel-interno.moneypromotora.com.br}"
DOMAIN_INTERNO_HML="${DOMAIN_INTERNO_HML:-interno-hml.moneypromotora.com.br}"
DOMAIN_PLATAFORMA_HML="${DOMAIN_PLATAFORMA_HML:-plataforma-hml.moneypromotora.com.br}"
DOMAIN_PAINEL_HML="${DOMAIN_PAINEL_HML:-painel-interno-hml.moneypromotora.com.br}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@moneypromotora.com.br}"

if [ -f .env.production ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.production
  set +a
fi

DOMAINS=()
case "$TARGET" in
  prod) DOMAINS=("$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL") ;;
  hml)  DOMAINS=("$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML") ;;
  all)
    DOMAINS=(
      "$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL"
      "$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML"
    )
    ;;
  *) echo "Uso: $0 [prod|hml|all]"; exit 1 ;;
esac

echo "==> Garantindo nginx do HOST ativo (outros sites dependem dele)..."
sudo systemctl start nginx 2>/dev/null || true

echo "==> Instalando conf bootstrap (HTTP)..."
sudo mkdir -p /var/www/certbot
sudo cp "$REPO/deploy/nginx/universidade-sites-bootstrap.conf" /etc/nginx/sites-available/universidade-sites
sudo ln -sf /etc/nginx/sites-available/universidade-sites /etc/nginx/sites-enabled/universidade-sites
sudo nginx -t
sudo systemctl reload nginx

if ! command -v certbot >/dev/null 2>&1; then
  echo "Instalando certbot..."
  sudo apt-get update -y
  sudo apt-get install -y certbot python3-certbot-nginx
fi

echo "==> Emitindo certificados (certbot --nginx no HOST)..."
for d in "${DOMAINS[@]}"; do
  echo "---- $d ----"
  sudo certbot --nginx -d "$d" \
    --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive \
    --redirect || echo "AVISO: falha em $d (DNS A → esta VPS?)"
done

echo "==> Aplicando conf completa com SSL..."
sudo cp "$REPO/deploy/nginx/universidade-sites.conf" /etc/nginx/sites-available/universidade-sites
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "Concluído. Nginx do host permanece no ar (outros sites intactos)."
for d in "${DOMAINS[@]}"; do
  echo "  curl -I https://$d/"
done
