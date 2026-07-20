#!/bin/sh
# Aguarda Postgres, aplica migrations, collectstatic e inicia o processo.
set -e

echo "==> Aguardando PostgreSQL em ${DB_HOST:-db}:${DB_PORT:-5432}..."
python <<'PY'
import os
import socket
import time

host = os.getenv("DB_HOST", "db")
port = int(os.getenv("DB_PORT", "5432"))
deadline = time.time() + 60

while time.time() < deadline:
    try:
        with socket.create_connection((host, port), timeout=2):
            print(f"PostgreSQL disponível em {host}:{port}")
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit(f"Timeout aguardando PostgreSQL em {host}:{port}")
PY

echo "==> Aplicando migrations..."
python manage.py migrate --noinput

echo "==> Garantindo superuser (se SUPERUSER_* definido)..."
python manage.py ensure_superuser

echo "==> Collectstatic..."
python manage.py collectstatic --noinput

echo "==> Iniciando: $*"
exec "$@"
