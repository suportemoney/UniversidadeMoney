---
name: universidade-architecture
description: Mantém o contexto da arquitetura do sistema UniversidadeMoney (Django+DRF, React, deploy em VPS com nginx/systemd/PostgreSQL). Use quando estruturar pastas, configurar settings/env, ou explicar como front/back/deploy se conectam.
disable-model-invocation: true
---

# UniversidadeMoney — Arquitetura (Contexto do Projeto)

## Objetivo

- Código é desenvolvido localmente e versionado no Git.
- A execução “de verdade” acontece na VPS (serviços, banco, domínio).
- O repositório deve carregar **configuração de produção** (ex.: variáveis e templates), mas **segredos** ficam fora do Git.

## Stack (padrão)

- **Banco**: PostgreSQL (na VPS).
- **Back-end**: Python + Django + Django REST Framework (API).
- **Front-end**: React (SPA) com tooling via Node.js (build).
- **Edge**: nginx como reverse proxy + static hosting.
- **Process manager**: systemd (`.service`) para o backend (gunicorn).

## Estrutura sugerida do repositório

Preferir monorepo:

```
backend/        # Django + DRF
frontend/       # React (build estático)
deploy/         # nginx + systemd + scripts (somente VPS)
.github/        # workflow de deploy (push main -> VPS)
ARCHITECTURE.md # documentação de arquitetura
```

## Portas (UniversidadeMoney na VPS)

Faixa reservada: **7101+**. Não reutilizar portas de outros projetos (ex.: gunicorn **9001**).

| Porta | Uso |
|-------|-----|
| **7101** | Gunicorn Django (`127.0.0.1:7101`) |
| **7102** | Reservada (expansão futura) |
| **5432** | PostgreSQL compartilhado (`127.0.0.1`); banco `universidade_money` |
| **80/443** | nginx (compartilhado, roteia por subdomínio) |

React em produção: build estático, **sem porta** (nginx serve).

## Contratos de integração

- **API**: prefixo `/api/` (nginx encaminha para `127.0.0.1:7101`).
- **Admin**: `/admin/` (nginx encaminha para `127.0.0.1:7101`).
- **SPA**: nginx serve `index.html` e assets; fallback `try_files ... /index.html`.
- **Static/media Django**: `STATIC_ROOT` e `MEDIA_ROOT` fora do repo e servidos pelo nginx.

## Configuração por ambiente (regras)

- `*.env` reais: **somente VPS**.
- No Git: apenas `*.env.example` (sem segredos).
- Django settings: preferir split (`base.py`, `production.py`, opcional `local.py`).

## Padrão de deploy (alto nível)

- Push na `main` aciona deploy (ex.: GitHub Actions + SSH).
- Na VPS o deploy faz:
  - `git pull`
  - backend: instalar deps, `migrate`, `collectstatic`, restart service
  - frontend: `npm ci`, `npm run build`, publicar `dist/`, reload nginx

## O que evitar

- Rodar serviços “de produção” na máquina local como requisito (o local é para editar/testar, não para hospedar).
- Commitar `.env` real, chaves, senhas, tokens.
