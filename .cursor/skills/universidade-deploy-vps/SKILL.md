---
name: universidade-deploy-vps
description: Padroniza o deploy do UniversidadeMoney para VPS (nginx + systemd + gunicorn + build React). Use ao criar/ajustar arquivos em deploy/, workflows de CI/CD, unit files .service e conf do nginx.
disable-model-invocation: true
---

# UniversidadeMoney — Deploy na VPS (Padrão)

## Alvo

- Domínio/subdomínio: `universidade.moneypromotora.com.br`
- nginx termina TLS e roteia:
  - `/api/` e `/admin/` -> gunicorn (`127.0.0.1:7101`)
  - `/` -> React build estático
  - `/static/` e `/media/` -> diretórios do host (alias)

## Portas (UniversidadeMoney)

| Porta | Serviço | Bind |
|-------|---------|------|
| **7101** | Gunicorn (backend) | `127.0.0.1:7101` |
| **7102** | Reservada | `127.0.0.1:7102` |
| **5432** | PostgreSQL | `127.0.0.1:5432` (instância compartilhada; banco `universidade_money`) |

Não usar portas de outros projetos na mesma VPS (ex.: **9001**).
Verificar disponibilidade: `sudo ss -tulpn | grep 7101`

## Layout na VPS (padrão recomendado)

```
/var/www/universidade/
  repo/            # clone do git
  venv/            # virtualenv python
  frontend-dist/   # artefato do build do React
  static/          # collectstatic
  media/           # uploads
  .env             # variáveis reais (fora do git)
```

## systemd (backend)

- Um service único para o backend (ex.: `universidade-backend.service`)
- Deve:
  - usar `WorkingDirectory` no `backend/`
  - carregar `EnvironmentFile=/var/www/universidade/.env`
  - reiniciar automaticamente (`Restart=always`)
  - bind apenas em `127.0.0.1:7101`
  - exemplo ExecStart: `gunicorn config.wsgi:application --bind 127.0.0.1:7101 --workers 3`

## Build do frontend

- Node.js é dependência **de build**, não serviço permanente.
- Produção preferida: `npm run build` -> publicar em `frontend-dist/` -> nginx serve.

## Deploy automatizado (preferência)

- Trigger: push na `main`.
- Ação: SSH na VPS e rodar um script único de deploy (ex.: `deploy/scripts/deploy.sh`).
- O script deve ser idempotente e falhar rápido (`set -e`).

## Segurança (mínimo)

- `.env` real nunca vai para o Git.
- Banco PostgreSQL não deve ficar exposto na internet pública.
- Permissões de arquivos: `www-data` onde fizer sentido; evitar root exceto `systemctl`/`nginx reload`.

## Guias detalhados

Consultar `docs/` no repositório:

- `docs/postgresql-vps.md`
- `docs/backend-vps.md`
- `docs/frontend-vps.md`
- `docs/nginx-vps.md`
- `docs/deploy-vps.md`
