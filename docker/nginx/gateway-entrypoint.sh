#!/bin/bash
# Gera conf nginx: HTTPS só para domínios com certificado; demais em HTTP (ACME).
set -e

DOMAIN_INTERNO="${DOMAIN_INTERNO:-interno.moneypromotora.com.br}"
DOMAIN_PLATAFORMA="${DOMAIN_PLATAFORMA:-plataforma.moneypromotora.com.br}"
DOMAIN_PAINEL="${DOMAIN_PAINEL:-painel-interno.moneypromotora.com.br}"
DOMAIN_INTERNO_HML="${DOMAIN_INTERNO_HML:-interno-hml.moneypromotora.com.br}"
DOMAIN_PLATAFORMA_HML="${DOMAIN_PLATAFORMA_HML:-plataforma-hml.moneypromotora.com.br}"
DOMAIN_PAINEL_HML="${DOMAIN_PAINEL_HML:-painel-interno-hml.moneypromotora.com.br}"

CONF=/etc/nginx/conf.d/default.conf
: > "$CONF"

has_cert() {
  [ -f "/etc/letsencrypt/live/$1/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/$1/privkey.pem" ]
}

# Bloco ACME compartilhado na porta 80 (todos os hosts)
cat >> "$CONF" <<EOF
server {
    listen 80;
    server_name ${DOMAIN_INTERNO} ${DOMAIN_PLATAFORMA} ${DOMAIN_PAINEL} ${DOMAIN_INTERNO_HML} ${DOMAIN_PLATAFORMA_HML} ${DOMAIN_PAINEL_HML};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

write_https_server() {
  local domain="$1"
  local backend="$2"
  local frontend="$3"
  local static_root="$4"
  local media_root="$5"

  if has_cert "$domain"; then
    echo "==> HTTPS: $domain → $frontend"
    cat >> "$CONF" <<EOF
server {
    listen 443 ssl http2;
    server_name ${domain};
    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    client_max_body_size 500M;

    location /api/ {
        proxy_pass http://${backend};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /admin/ {
        proxy_pass http://${backend};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /static/ { alias ${static_root}; expires 30d; access_log off; }
    location /media/ { alias ${media_root}; expires 7d; access_log off; }
    location / {
        proxy_pass http://${frontend};
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  else
    echo "==> Sem cert (só HTTP/ACME): $domain"
    # Sem redirect forçado neste host — sobrescreve o redirect genérico com server dedicado HTTP
    cat >> "$CONF" <<EOF
server {
    listen 80;
    server_name ${domain};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /api/ {
        proxy_pass http://${backend};
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /admin/ {
        proxy_pass http://${backend};
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    location /static/ { alias ${static_root}; }
    location /media/ { alias ${media_root}; }
    location / {
        proxy_pass http://${frontend};
        proxy_set_header Host \$host;
    }
}
EOF
  fi
}

# Se NENHUM cert existir, não redirecionar HTTP→HTTPS (evita loop / cert errado do host)
any_cert=false
for d in "$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL" "$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML"; do
  if has_cert "$d"; then any_cert=true; break; fi
done

if [ "$any_cert" = false ]; then
  echo "==> Nenhum certificado — modo bootstrap HTTP puro"
  envsubst '${DOMAIN_INTERNO} ${DOMAIN_PLATAFORMA} ${DOMAIN_PAINEL} ${DOMAIN_INTERNO_HML} ${DOMAIN_PLATAFORMA_HML} ${DOMAIN_PAINEL_HML}' \
    < /etc/nginx/templates/gateway-bootstrap.conf.template \
    > "$CONF"
  exec "$@"
fi

# Com pelo menos um cert: conf mista (recomeça arquivo)
: > "$CONF"

# Redirect HTTP→HTTPS apenas para hosts que JÁ têm cert
http_ssl_hosts=""
http_plain_hosts=""
for d in "$DOMAIN_INTERNO" "$DOMAIN_PLATAFORMA" "$DOMAIN_PAINEL" "$DOMAIN_INTERNO_HML" "$DOMAIN_PLATAFORMA_HML" "$DOMAIN_PAINEL_HML"; do
  if has_cert "$d"; then
    http_ssl_hosts="$http_ssl_hosts $d"
  else
    http_plain_hosts="$http_plain_hosts $d"
  fi
done

if [ -n "$(echo "$http_ssl_hosts" | xargs)" ]; then
  cat >> "$CONF" <<EOF
server {
    listen 80;
    server_name ${http_ssl_hosts};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
fi

write_https_server "$DOMAIN_INTERNO" "backend-prod:8000" "frontend-interno-prod:80" "/data/prod/static/" "/data/prod/media/"
write_https_server "$DOMAIN_PLATAFORMA" "backend-prod:8000" "frontend-plataforma-prod:80" "/data/prod/static/" "/data/prod/media/"
write_https_server "$DOMAIN_PAINEL" "backend-prod:8000" "frontend-painel-prod:80" "/data/prod/static/" "/data/prod/media/"
write_https_server "$DOMAIN_INTERNO_HML" "backend-hml:8000" "frontend-interno-hml:80" "/data/hml/static/" "/data/hml/media/"
write_https_server "$DOMAIN_PLATAFORMA_HML" "backend-hml:8000" "frontend-plataforma-hml:80" "/data/hml/static/" "/data/hml/media/"
write_https_server "$DOMAIN_PAINEL_HML" "backend-hml:8000" "frontend-painel-hml:80" "/data/hml/static/" "/data/hml/media/"

exec "$@"
