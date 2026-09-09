# GitHub Actions — deploy Docker na VPS

Push na **`main`** dispara SSH na VPS, clone/fetch do repo e `deploy/scripts/deploy-docker.sh`.

Domínio: `universidade.moneypromotora.com.br` (`/` plataforma, `/interno`, `/painel`, `/api`).

## Pré-requisitos na VPS

- Docker + Compose v2
- Diretórios `/var/www/universidade/{repo,static,media}`
- Arquivo `.env` na raiz do clone (a partir de `.env.exemple`) — **não** versionado
- 80/443 = container `educamoney_nginx` (EducaMoney); UniversidadeMoney só injeta `universidade.conf`

```bash
chmod +x /var/www/universidade/repo/deploy/scripts/deploy-docker.sh
```

---

## Secrets no GitHub

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP da VPS |
| `VPS_USER` | usuário SSH (ex.: root) |
| `VPS_PORT` | porta SSH (ex.: 22) |
| `VPS_PASSWORD` | senha SSH |

Os valores saem do `.env` local (`PASSWORD_VPS` → secret `VPS_PASSWORD`). Não commitar `.env`.

O clone na VPS usa o `GITHUB_TOKEN` do job (repo privado).

---

## Workflow

| Arquivo | Branch | Alvo |
|---------|--------|------|
| [deploy-main.yml](../.github/workflows/deploy-main.yml) | `main` | produção |

```
push main → Actions → SSH (senha) → git clone/fetch → deploy-docker.sh
```

O Action **não** sobrescreve o `.env` da VPS.

---

## Testar

```bash
curl -I https://universidade.moneypromotora.com.br/
curl -I https://universidade.moneypromotora.com.br/interno/
curl -I https://universidade.moneypromotora.com.br/painel/
curl -I https://universidade.moneypromotora.com.br/api/
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `Permission denied` | Conferir `VPS_PASSWORD` e usuário |
| Falta `.env` | Copiar do `.env.exemple` na VPS (DEBUG=0, DB_HOST=db) |
| 502 | Containers em 7101/7110/7111/7112? `docker compose ps` |
| Certificado | DNS A no domínio e `issue-ssl-certs.sh` |

## Segurança

- `.env` só na VPS e na máquina local
- Não commitar senhas, `DJANGO_SECRET_KEY` nem chave privada
