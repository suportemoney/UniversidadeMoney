# Docker — UniversidadeMoney

## Regra da VPS

O **nginx Docker do EducaMoney** (`educamoney_nginx`) continua na frente (80/443).  
Containers do UniversidadeMoney só escutam em `127.0.0.1`. O deploy injeta `conf.d/universidade.conf` nesse nginx — **nunca** edita o `default.conf` do EducaMoney.

## Portas (localhost)

| Porta | Serviço |
|-------|---------|
| 7101 | API prod |
| 7110 | interno (`/interno/`) |
| 7111 | plataforma (`/`) |
| 7112 | painel (`/painel/`) |

Domínio: `universidade.moneypromotora.com.br`

## Dev local

```bash
cp .env.exemple .env
# Preencher DJANGO_SECRET_KEY e demais campos
docker compose -f compose.yml -f compose.dev.yml --env-file .env up --build
```

## VPS — recarregar o nginx de borda (EducaMoney)

```bash
docker exec educamoney_nginx nginx -t
docker exec educamoney_nginx nginx -s reload
```

## VPS — Docker + site

```bash
cd /var/www/universidade/repo
git pull origin main
sed -i 's/\r$//' deploy/scripts/*.sh
bash deploy/scripts/install-docker-vps.sh   # se ainda não tiver Docker
bash deploy/scripts/deploy-docker.sh
bash deploy/scripts/issue-ssl-certs.sh
```

SSL usa **certbot webroot** em `/var/www/certbot` (já montado no `educamoney_nginx`), sem parar 80/443.
