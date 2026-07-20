# Docker — UniversidadeMoney

## Regra da VPS

O **nginx do host** continua na frente (80/443) para **todos** os sites.  
Containers Docker só escutam em `127.0.0.1` — **nunca** `systemctl stop nginx`.

## Portas (localhost)

| Porta | Serviço |
|-------|---------|
| 7101 | API prod |
| 7110 | interno |
| 7111 | plataforma |
| 7112 | painel |

## Dev local

```bash
cp .env.development.example .env.development
docker compose -f compose.yml -f compose.dev.yml --env-file .env.development up --build
```

## VPS — recuperar nginx (se foi parado por engano)

```bash
sudo systemctl start nginx
sudo systemctl status nginx
```

## VPS — Docker + sites

```bash
cd /var/www/universidade/repo
git pull origin main
sed -i 's/\r$//' deploy/scripts/*.sh
bash deploy/scripts/install-docker-vps.sh   # se ainda não tiver Docker
bash deploy/scripts/deploy-docker.sh prod
bash deploy/scripts/issue-ssl-certs.sh prod
```

SSL usa **certbot do host** (`certbot --nginx`), sem parar o nginx.
