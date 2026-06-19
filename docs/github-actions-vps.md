# GitHub Actions — deploy automático na VPS

Guia para configurar deploy na branch `main` via SSH.

## Pré-requisitos na VPS

- Projeto em `/var/www/universidade/repo`
- `deploy/scripts/deploy.sh` executável
- Backend e nginx já funcionando (setup inicial concluído)

Tornar o script executável (uma vez na VPS):

```bash
chmod +x /var/www/universidade/repo/deploy/scripts/deploy.sh
```

---

## 1. Gerar chave SSH para o GitHub Actions

**Na sua máquina local** (ou em ambiente seguro), não reutilize a chave pessoal da VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions-universidade" -f ~/.ssh/universidade_deploy -N ""
```

Arquivos gerados:

- `~/.ssh/universidade_deploy` — chave **privada** (vai para o GitHub Secret)
- `~/.ssh/universidade_deploy.pub` — chave **pública** (vai na VPS)

---

## 2. Autorizar a chave na VPS

Copie o conteúdo de `universidade_deploy.pub` e **na VPS**:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "COLE_A_CHAVE_PUBLICA_AQUI" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Teste **da sua máquina local**:

```bash
ssh -i ~/.ssh/universidade_deploy root@168.231.97.235 "echo ok"
```

Deve retornar `ok` sem pedir senha.

---

## 3. Secrets no GitHub

Repositório: `suportemoney/UniversidadeMoney`

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | `168.231.97.235` (ou hostname da VPS) |
| `VPS_USER` | `root` (ou usuário com permissão de deploy) |
| `VPS_SSH_KEY` | Conteúdo completo de `~/.ssh/universidade_deploy` (chave privada) |

> A chave privada inclui `-----BEGIN OPENSSH PRIVATE KEY-----` até `-----END OPENSSH PRIVATE KEY-----`.

---

## 4. Workflow

Arquivo: [.github/workflows/deploy-main.yml](../.github/workflows/deploy-main.yml)

Trigger: **push na branch `main`**

Fluxo:

```
push main → GitHub Actions → SSH na VPS → deploy/scripts/deploy.sh
```

---

## 5. Testar deploy automático

1. Faça um commit qualquer na `main` e push
2. GitHub → **Actions** → workflow **Deploy VPS**
3. Na VPS, após sucesso:

```bash
curl https://universidade.moneypromotora.com.br/api/health/
```

---

## 6. Troubleshooting

| Problema | Solução |
|----------|---------|
| `Permission denied (publickey)` | Conferir `VPS_SSH_KEY` e `authorized_keys` na VPS |
| `npm ci` falha | Garantir `package-lock.json` commitado no repo |
| `git pull` pede credencial | Repo na VPS deve usar SSH (`git@github.com:...`) |
| `sudo` pede senha no script | Usuário do deploy precisa de sudo sem senha para `systemctl` e `nginx` |

### Sudo sem senha (opcional, usuário de deploy)

```bash
visudo
```

```
deployuser ALL=(ALL) NOPASSWD: /bin/systemctl restart universidade-backend, /bin/systemctl reload nginx, /usr/sbin/nginx
```

---

## Segurança

- Use chave dedicada só para CI/CD
- Não commitar chaves privadas
- `.env` permanece **somente na VPS**
