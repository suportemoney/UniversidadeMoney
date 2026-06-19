# nginx na VPS — UniversidadeMoney

Guia para configurar o nginx como reverse proxy e servidor de arquivos estáticos.

## Contexto

- **Domínio**: `universidade.moneypromotora.com.br`
- **Portas públicas**: `80` (redirect) e `443` (HTTPS)
- **Backend (gunicorn)**: `127.0.0.1:7101`
- **Front estático**: `/var/www/universidade/frontend-dist/`
- **Static Django**: `/var/www/universidade/static/`
- **Media Django**: `/var/www/universidade/media/`

---

## 1. Instalar nginx (se necessário)

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 2. Arquivo de configuração

Criar `/etc/nginx/sites-available/universidade.conf`:

```nginx
server {
    listen 80;
    server_name universidade.moneypromotora.com.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name universidade.moneypromotora.com.br;

    # Certificados (certbot preenche estes caminhos)
    ssl_certificate     /etc/letsencrypt/live/universidade.moneypromotora.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/universidade.moneypromotora.com.br/privkey.pem;

    root /var/www/universidade/frontend-dist;
    index index.html;

    client_max_body_size 20M;

    # API Django
    location /api/ {
        proxy_pass http://127.0.0.1:7101;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Django
    location /admin/ {
        proxy_pass http://127.0.0.1:7101;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Arquivos estáticos do Django
    location /static/ {
        alias /var/www/universidade/static/;
        expires 30d;
        access_log off;
    }

    # Uploads
    location /media/ {
        alias /var/www/universidade/media/;
        expires 7d;
        access_log off;
    }

    # SPA React — fallback para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Ativar o site:

```bash
sudo ln -sf /etc/nginx/sites-available/universidade.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. SSL com Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d universidade.moneypromotora.com.br
```

Renovação automática (geralmente já configurada):

```bash
sudo certbot renew --dry-run
```

---

## 4. DNS

Antes do certificado, o registro DNS deve apontar para o IP da VPS:

```
universidade.moneypromotora.com.br  →  A  →  IP_DA_VPS
```

---

## 5. Comandos do dia a dia

| Ação | Comando |
|------|---------|
| Testar config | `sudo nginx -t` |
| Recarregar | `sudo systemctl reload nginx` |
| Reiniciar | `sudo systemctl restart nginx` |
| Status | `sudo systemctl status nginx` |
| Logs de erro | `sudo tail -f /var/log/nginx/error.log` |
| Logs de acesso | `sudo tail -f /var/log/nginx/access.log` |

---

## 6. Verificar roteamento

```bash
curl -I https://universidade.moneypromotora.com.br/
curl -I https://universidade.moneypromotora.com.br/api/
curl -I https://universidade.moneypromotora.com.br/admin/
```

Confirmar que gunicorn responde localmente:

```bash
curl -I http://127.0.0.1:7101/admin/
```

---

## 7. Troubleshooting

| Sintoma | Verificação |
|---------|-------------|
| **502 Bad Gateway** | Backend down ou porta errada — deve ser `7101`, não `9001` |
| **404 na API** | `proxy_pass` aponta para `127.0.0.1:7101`? |
| **CSRF error no admin** | `CSRF_TRUSTED_ORIGINS` no `.env` com HTTPS |
| **Mixed content** | Front deve chamar API via HTTPS |
| **Rota React 404** | Falta `try_files ... /index.html` |
| **Certificado inválido** | DNS propagado? Rodar certbot novamente |

Próximo passo: [deploy-vps.md](deploy-vps.md)
