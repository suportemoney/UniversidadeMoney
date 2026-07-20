#!/bin/sh
# Cria databases adicionais no mesmo Postgres (prod + homolog na VPS).
# Variáveis: POSTGRES_MULTIPLE_DATABASES=db1,db2
set -e
set -u

if [ -z "${POSTGRES_MULTIPLE_DATABASES:-}" ]; then
  exit 0
fi

create_db() {
  local database="$1"
  echo "Criando database '$database' (se não existir)..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE "' || '$database' || '"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database')\gexec
    GRANT ALL PRIVILEGES ON DATABASE "$database" TO "$POSTGRES_USER";
EOSQL
}

echo "Databases extras: $POSTGRES_MULTIPLE_DATABASES"
for db in $(echo "$POSTGRES_MULTIPLE_DATABASES" | tr ',' ' '); do
  create_db "$db"
done
