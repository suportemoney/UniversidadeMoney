# Front-end na VPS — UniversidadeMoney

Guia para buildar e publicar o React. Em produção **não há servidor Node rodando** — o nginx entrega arquivos estáticos.

## Contexto

- **Stack**: React + Node.js (somente para build).
- **Saída do build**: `/var/www/universidade/frontend-dist/`
- **URL pública**: `https://universidade.moneypromotora.com.br/`
- **API**: `https://universidade.moneypromotora.com.br/api/`

---

## 1. Instalar Node.js (somente para build)

Recomendado: Node LTS via NodeSource ou nvm.

Exemplo (Node 20 LTS — Ubuntu):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

> Node **não** precisa de systemd/service neste projeto.

---

## 2. Variáveis de ambiente do front

Antes do build, configurar a URL da API.

Exemplo (`frontend/.env.production` ou variável no momento do build):

```env
VITE_API_URL=https://universidade.moneypromotora.com.br/api
```

Ajuste o prefixo (`VITE_`, `REACT_APP_`, etc.) conforme o bundler do projeto (Vite, CRA, etc.).

---

## 3. Build do React

```bash
cd /var/www/universidade/repo/frontend
npm ci
npm run build
```

Pastas comuns de saída:

| Ferramenta | Pasta |
|------------|-------|
| Vite | `dist/` |
| Create React App | `build/` |

---

## 4. Publicar arquivos estáticos

Exemplo assumindo Vite (`dist/`):

```bash
sudo rm -rf /var/www/universidade/frontend-dist/*
sudo cp -r /var/www/universidade/repo/frontend/dist/* /var/www/universidade/frontend-dist/
sudo chown -R www-data:www-data /var/www/universidade/frontend-dist
```

Recarregar nginx após publicar:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Verificar

```bash
curl -I https://universidade.moneypromotora.com.br/
curl -I https://universidade.moneypromotora.com.br/api/
```

No navegador: abrir o site e confirmar que chamadas vão para `/api/` no mesmo domínio (evita problemas de CORS).

---

## 6. Atualizar front-end (manual)

```bash
cd /var/www/universidade/repo
git pull origin main

cd frontend
npm ci
npm run build

sudo rm -rf /var/www/universidade/frontend-dist/*
sudo cp -r dist/* /var/www/universidade/frontend-dist/
sudo chown -R www-data:www-data /var/www/universidade/frontend-dist

sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. SPA — rotas do React

O nginx deve ter fallback para `index.html` em rotas do React (ex.: `/dashboard`). Isso é configurado em [nginx-vps.md](nginx-vps.md):

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 8. Troubleshooting

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| Página em branco | Build com URL de API errada | Refazer build com `.env.production` correto |
| 404 em rotas internas | Falta fallback SPA no nginx | Ajustar `try_files` |
| API em localhost no JS | Variável de ambiente errada no build | Usar URL pública HTTPS |
| Assets antigos | Cache do navegador ou build não copiado | Limpar `frontend-dist` e rebuild |

---

## 9. O que NÃO fazer

- Não rodar `npm run dev` em produção.
- Não expor porta do Node (3000, 5173, etc.) publicamente.
- Não commitar `.env` com segredos.

Próximo passo: [nginx-vps.md](nginx-vps.md)
