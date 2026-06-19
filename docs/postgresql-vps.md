# PostgreSQL na VPS — UniversidadeMoney

Guia para instalar (se necessário), criar banco/usuário e operar o PostgreSQL usado pelo projeto.

## Contexto

- **Porta**: `5432` (instância compartilhada na VPS).
- **Bind esperado**: `127.0.0.1` (somente local — não expor na internet).
- **Banco deste projeto**: `universidade_money`.
- **Usuário sugerido**: `universidade_user`.

> Na sua VPS o PostgreSQL já pode estar rodando. Confirme com:
> `sudo ss -tulpn | grep 5432`

---

## 1. Instalar PostgreSQL (somente se ainda não existir)

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo systemctl status postgresql
```

---

## 2. Criar usuário e banco

Entrar como superusuário do Postgres:

```bash
sudo -u postgres psql
```

No prompt `postgres=#`, executar (troque a senha):

```sql
CREATE USER universidade_user WITH PASSWORD 'SENHA_FORTE_AQUI';
CREATE DATABASE universidade_money OWNER universidade_user;
GRANT ALL PRIVILEGES ON DATABASE universidade_money TO universidade_user;
\q
```

### Permissões no schema public (PostgreSQL 15+)

Se migrations falharem por permissão em `public`:

```bash
sudo -u postgres psql -d universidade_money
```

```sql
GRANT ALL ON SCHEMA public TO universidade_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO universidade_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO universidade_user;
\q
```

---

## 3. Testar conexão

```bash
psql -h 127.0.0.1 -U universidade_user -d universidade_money -W
```

Comandos úteis dentro do `psql`:

```sql
\conninfo
\dt
\q
```

---

## 4. Variáveis para o backend (`.env` na VPS)

Arquivo: `/var/www/universidade/.env`

```env
DB_ENGINE=django.db.backends.postgresql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=universidade_money
DB_USER=universidade_user
DB_PASSWORD=SENHA_FORTE_AQUI
```

> O `.env` real **nunca** vai para o Git.

---

## 5. Segurança

- PostgreSQL deve escutar apenas em `127.0.0.1`.
- Não abrir porta `5432` no firewall para a internet.
- Usar senha forte e usuário dedicado (não usar `postgres` no Django).

Verificar bind (exemplo):

```bash
sudo ss -tulpn | grep 5432
```

Esperado: `127.0.0.1:5432` (e eventualmente `[::1]:5432`).

---

## 6. Backup e restore

### Backup

```bash
sudo -u postgres pg_dump -Fc universidade_money > universidade_money_$(date +%F).dump
```

### Restore

```bash
sudo -u postgres pg_restore -d universidade_money --clean --if-exists universidade_money_YYYY-MM-DD.dump
```

---

## 7. Comandos do dia a dia

| Ação | Comando |
|------|---------|
| Status do serviço | `sudo systemctl status postgresql` |
| Reiniciar | `sudo systemctl restart postgresql` |
| Listar bancos | `sudo -u postgres psql -c "\l"` |
| Listar conexões | `sudo -u postgres psql -c "SELECT datname, usename, client_addr FROM pg_stat_activity;"` |

---

## 8. Troubleshooting

| Problema | Verificação |
|----------|-------------|
| `connection refused` | PostgreSQL está rodando? `systemctl status postgresql` |
| `password authentication failed` | Senha no `.env` confere com o usuário criado? |
| `permission denied for schema public` | Aplicar grants da seção 2 |
| Django não conecta | `DB_HOST=127.0.0.1` e `DB_PORT=5432` |

Próximo passo: [backend-vps.md](backend-vps.md)
