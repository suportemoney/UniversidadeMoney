# Backend na VPS — UniversidadeMoney

Guia para instalar, configurar, ativar e operar o backend Django + DRF com Gunicorn.

## Contexto

- **Porta gunicorn**: `127.0.0.1:7101` (exclusiva deste projeto).
- **Não usar** porta `9001` (outro projeto na mesma VPS).
- **Diretório base**: `/var/www/universidade/`
- **Domínio**: `universidade.moneypromotora.com.br`

---

## 1. Estrutura de pastas na VPS

```bash
sudo mkdir -p /var/www/universidade/{repo,static,media,frontend-dist}
sudo chown -R $USER:www-data /var/www/universidade
```

Layout final:

```
/var/www/universidade/
  repo/              # clone do Git (contém backend/ e frontend/)
  venv/              # virtualenv Python
  static/            # collectstatic
  media/             # uploads
  frontend-dist/     # build do React (nginx serve)
  .env               # variáveis reais (fora do git)
```

---

## 2. Clonar o repositório

```bash
cd /var/www/universidade
git clone https://github.com/SEU_USUARIO/UniversidadeMoney.git repo
cd repo
```

---

## 3. Virtualenv e dependências

```bash
cd /var/www/universidade
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r repo/backend/requirements.txt
```

---

## 4. Arquivo `.env` do backend

Criar `/var/www/universidade/.env`:

```env
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=gerar-uma-chave-longa-e-aleatoria
DEBUG=False

DB_ENGINE=django.db.backends.postgresql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=universidade_money
DB_USER=universidade_user
DB_PASSWORD=SENHA_FORTE_AQUI

ALLOWED_HOSTS=universidade.moneypromotora.com.br
CSRF_TRUSTED_ORIGINS=https://universidade.moneypromotora.com.br
CORS_ALLOWED_ORIGINS=https://universidade.moneypromotora.com.br

STATIC_ROOT=/var/www/universidade/static
MEDIA_ROOT=/var/www/universidade/media
```

Permissões:

```bash
chmod 640 /var/www/universidade/.env
sudo chown root:www-data /var/www/universidade/.env
```

---

## 5. Migrations, superusuário e static

Com venv ativo:

```bash
cd /var/www/universidade/repo/backend
source /var/www/universidade/venv/bin/activate
export $(grep -v '^#' /var/www/universidade/.env | xargs)

python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

---

## 6. Testar gunicorn manualmente (antes do systemd)

```bash
cd /var/www/universidade/repo/backend
source /var/www/universidade/venv/bin/activate
export $(grep -v '^#' /var/www/universidade/.env | xargs)

gunicorn config.wsgi:application --bind 127.0.0.1:7101 --workers 3
```

Em outro terminal:

```bash
curl -I http://127.0.0.1:7101/admin/
sudo ss -tulpn | grep 7101
```

Interromper com `Ctrl+C` após validar.

---

## 7. systemd — ativar o backend

Criar `/etc/systemd/system/universidade-backend.service`:

```ini
[Unit]
Description=UniversidadeMoney - Django API (Gunicorn)
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/universidade/repo/backend
EnvironmentFile=/var/www/universidade/.env
ExecStart=/var/www/universidade/venv/bin/gunicorn config.wsgi:application \
    --bind 127.0.0.1:7101 \
    --workers 3
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Ativar e iniciar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable universidade-backend
sudo systemctl start universidade-backend
sudo systemctl status universidade-backend
```

---

## 8. Comandos do dia a dia

| Ação | Comando |
|------|---------|
| Ver status | `sudo systemctl status universidade-backend` |
| Iniciar | `sudo systemctl start universidade-backend` |
| Parar | `sudo systemctl stop universidade-backend` |
| Reiniciar | `sudo systemctl restart universidade-backend` |
| Logs | `sudo journalctl -u universidade-backend -f` |
| Ver porta | `sudo ss -tulpn | grep 7101` |

---

## 9. Atualizar backend (manual)

```bash
cd /var/www/universidade/repo
git pull origin main

source /var/www/universidade/venv/bin/activate
pip install -r backend/requirements.txt

cd backend
export $(grep -v '^#' /var/www/universidade/.env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput

sudo systemctl restart universidade-backend
```

---

## 10. Troubleshooting

| Problema | Verificação |
|----------|-------------|
| Service falha ao iniciar | `journalctl -u universidade-backend -n 50` |
| Porta 7101 em uso | `sudo ss -tulpn | grep 7101` |
| Erro de banco | Conferir [postgresql-vps.md](postgresql-vps.md) e `.env` |
| 502 no nginx | Gunicorn está rodando na 7101? |
| Permissão em static/media | `sudo chown -R www-data:www-data /var/www/universidade/static /var/www/universidade/media` |

Próximo passo: [frontend-vps.md](frontend-vps.md) e [nginx-vps.md](nginx-vps.md)
