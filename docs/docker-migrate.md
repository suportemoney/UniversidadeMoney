# Migrar PostgreSQL do host para o volume Docker

Procedimento para importar o banco legado da VPS para o container `db`.

## 1. Dump no host (antes de desligar o Postgres antigo)

```bash
sudo -u postgres pg_dump -Fc universidade_money > /tmp/universidade_money.dump
```

## 2. Subir só o Postgres Docker (se ainda não estiver)

```bash
cd /var/www/universidade/repo
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production up -d db
```

## 3. Restore no container

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production \
  exec -T db pg_restore -U universidade_user -d universidade_money --clean --if-exists \
  < /tmp/universidade_money.dump
```

Homologação (banco vazio ou cópia):

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production \
  exec -T db pg_restore -U universidade_user -d universidade_money_hml --clean --if-exists \
  < /tmp/universidade_money.dump
```

## 4. Conferir

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production \
  exec db psql -U universidade_user -d universidade_money -c '\dt'
```

## 5. Media files

Se houver uploads em `/var/www/universidade/media`, copie para o volume:

```bash
docker compose -f compose.yml -f compose.vps.yml --env-file .env.production up -d backend-prod
docker cp /var/www/universidade/media/. "$(docker compose -f compose.yml -f compose.vps.yml --env-file .env.production ps -q backend-prod)":/data/media/
```

Depois reinicie `backend-prod` e `gateway`.
