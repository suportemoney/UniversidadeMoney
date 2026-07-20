# GitHub Actions — deploy Docker na VPS

Deploy automático via SSH:

- branch **`main`** → produção (`deploy-docker.sh prod`)
- branch **`homolog`** → homologação (`deploy-docker.sh hml`)

## Pré-requisitos na VPS

- Docker + Compose v2 instalados
- Clone em `/var/www/universidade/repo`
- Arquivos `.env.production` e `.env.homolog` (a partir dos exemplos)
- Stack inicial já sobe (ver [docker.md](docker.md))

```bash
chmod +x /var/www/universidade/repo/deploy/scripts/deploy-docker.sh
```

---

## 1. Chave SSH para o GitHub Actions

```bash
ssh-keygen -t ed25519 -C "github-actions-universidade" -f ~/.ssh/universidade_deploy -N ""
```

- Privada → secret `VPS_SSH_KEY`
- Pública → `~/.ssh/authorized_keys` na VPS

Teste:

```bash
ssh -i ~/.ssh/universidade_deploy USUARIO@HOST "echo ok"
```

---

## 2. Secrets no GitHub

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_USER` | usuário SSH |
| `VPS_SSH_KEY` | chave privada completa |

---

## 3. Workflows

| Arquivo | Branch | Alvo |
|---------|--------|------|
| [deploy-main.yml](../.github/workflows/deploy-main.yml) | `main` | prod |
| [deploy-homolog.yml](../.github/workflows/deploy-homolog.yml) | `homolog` | hml |

Fluxo:

```
push main|homolog → Actions → SSH → deploy/scripts/deploy-docker.sh prod|hml
```

---

## 4. Testar

1. Push na `main` ou `homolog`
2. GitHub → **Actions**
3. Conferir:

```bash
curl -I https://universidade.moneypromotora.com.br/
curl -I https://universidade-hml.moneypromotora.com.br/
```

---

## 5. Troubleshooting

| Problema | Solução |
|----------|---------|
| `Permission denied (publickey)` | Conferir `VPS_SSH_KEY` e `authorized_keys` |
| Falta `.env.production` | Copiar do `.example` na VPS |
| Gateway sem HTTPS | Rodar `certbot-init` e recrear gateway |
| Branch `homolog` inexistente | Criar e dar push: `git checkout -b homolog && git push -u origin homolog` |

## Segurança

- Chave dedicada só para CI/CD
- Não commitar `.env.production` / `.env.homolog` / chaves privadas
