## Arquitetura — UniversidadeMoney

### Objetivo

Este repositório é pensado para **desenvolvimento local (código)** e **execução em VPS (serviços)**. O deploy acontece quando a branch `main` é atualizada: a VPS recebe o código, atualiza dependências, aplica migrations, builda o front e reinicia serviços.

### Componentes

- **PostgreSQL (VPS)**: banco de dados principal.
- **Django + DRF (VPS)**: API e admin.
- **Gunicorn (VPS)**: servidor WSGI do Django, atrás do nginx.
- **systemd (VPS)**: gerencia o processo do backend (`.service`).
- **React (build)**: SPA entregue como arquivos estáticos.
- **Node.js (build)**: usado para instalar dependências e gerar o build do React.
- **nginx (VPS)**: reverse proxy da API e servidor de arquivos estáticos (front + static/media).

### Topologia (alto nível)

```mermaid
flowchart LR
  Dev[Dev local\n(só código)] -->|git push main| GH[GitHub]
  GH -->|deploy automático| VPS[VPS]
  VPS --> Nginx[nginx\nuniversidade.moneypromotora.com.br]
  Nginx -->|/api /admin| API[Django+DRF\nGunicorn 127.0.0.1:7101]
  API --> DB[(PostgreSQL\n127.0.0.1:5432)]
  Nginx -->|/| FE[React build\narquivos estáticos]
  Nginx -->|/static /media| Files[(static/media no host)]
```

### Portas (UniversidadeMoney)

Faixa reservada para este projeto na VPS: **7101+**. Não reutilizar portas de outros sistemas (ex.: gunicorn na **9001**).

| Porta | Serviço | Endereço | Observação |
|-------|---------|----------|------------|
| **7101** | Gunicorn (Django + DRF) | `127.0.0.1:7101` | Backend exclusivo deste projeto |
| **7102** | Reservada | `127.0.0.1:7102` | Expansão futura (worker, websocket, etc.) |
| **5432** | PostgreSQL | `127.0.0.1:5432` | Instância compartilhada na VPS; banco/usuário próprios |
| **80 / 443** | nginx | `0.0.0.0` | Compartilhado; roteia por subdomínio |
| — | React (build) | — | Sem porta — arquivos estáticos servidos pelo nginx |

Banco PostgreSQL sugerido: `universidade_money` (usuário dedicado, ex.: `universidade_user`).

### Contratos de URL

- **API**: `/api/` (nginx faz proxy para `127.0.0.1:7101`).
- **Admin**: `/admin/` (nginx faz proxy para `127.0.0.1:7101`).
- **SPA**: `/` (nginx serve `index.html` + assets; fallback com `try_files`).
- **Django static/media**:
  - `/static/` -> `STATIC_ROOT` (no host)
  - `/media/` -> `MEDIA_ROOT` (no host)

### Estrutura recomendada do repositório

Monorepo:

```
backend/                 # Django + DRF
frontend/                # React
deploy/
  nginx/                 # conf do nginx
  systemd/               # unit files .service
  scripts/               # script de deploy (idempotente)
.github/workflows/       # pipeline de deploy
ARCHITECTURE.md
docs/                    # guias operacionais (VPS)
```

### Guias operacionais (VPS)

Documentação passo a passo em [docs/README.md](docs/README.md):

- [postgresql-vps.md](docs/postgresql-vps.md) — banco de dados
- [backend-vps.md](docs/backend-vps.md) — Django, gunicorn, systemd
- [frontend-vps.md](docs/frontend-vps.md) — build React
- [nginx-vps.md](docs/nginx-vps.md) — proxy e SSL
- [deploy-vps.md](docs/deploy-vps.md) — deploy e troubleshooting

### Configuração (ambientes)

- **Segredos e variáveis reais** ficam **apenas na VPS** (ex.: `/var/www/universidade/.env`).
- No Git ficam apenas modelos:
  - `backend/.env.example`
  - `frontend/.env.example`
- **Django settings** recomendado:
  - `backend/config/settings/base.py`
  - `backend/config/settings/production.py`
  - (opcional) `backend/config/settings/local.py`

### Deploy (resumo)

Na VPS, o deploy deve executar de forma repetível:

- **Backend**
  - instalar/atualizar dependências (`pip`)
  - `migrate`
  - `collectstatic`
  - reiniciar o service do backend (systemd)
- **Frontend**
  - `npm ci`
  - `npm run build`
  - publicar `dist/` em um diretório servido pelo nginx
- **nginx**
  - `reload` após atualização de conf ou assets

### Decisões de arquitetura (por quê)

- **React build estático + nginx**: reduz complexidade na VPS (sem processo Node 24/7).
- **Gunicorn + systemd**: padrão sólido, fácil de observar/reiniciar.
- **PostgreSQL local na VPS**: menor superfície de ataque (evitar expor porta do banco).
- **Gunicorn na 7101**: isola este projeto de outros backends na mesma VPS (ex.: 9001).
