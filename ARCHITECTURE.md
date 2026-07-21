## Arquitetura — UniversidadeMoney

### Edge (importante)

**nginx do HOST** escuta 80/443 e serve **todos** os sites da VPS.  
Docker **não** ocupa 80/443 — só `127.0.0.1` (faixa 7101+).

| Porta local | Serviço |
|-------------|---------|
| 7101 | backend-prod |
| 7102 | backend-hml |
| 7110 | frontend-interno-prod |
| 7111 | frontend-plataforma-prod |
| 7112 | frontend-painel-prod |

### Subdomínios

| Host | Upstream |
|------|----------|
| `interno.moneypromotora.com.br` | 127.0.0.1:7110 |
| `plataforma.moneypromotora.com.br` | 127.0.0.1:7111 + API 7101 |
| `painel-interno.moneypromotora.com.br` | 127.0.0.1:7112 + API 7101 |

### Modo LMS interno

A plataforma é um **LMS interno de colaboradores** — sem planos/clientes no fluxo real.

- Autenticado ativo = acesso a cursos, trilhas, ao vivo, etc.
- App `planos` permanece no código/banco; endpoints públicos de resgate/catálogo respondem **410**.
- Login: CPF + senha (após ativação via TokenAcesso no portal interno).

### Fluxo TokenAcesso (colaborador)

1. Painel cria colaborador + token  
2. Interno valida token → setup senha/CPF  
3. Plataforma: login CPF + senha  

### Tokens de integração (API Key)

Fluxo seguro (hash SHA-256 no banco; plaintext só uma vez):

1. Painel **API** gera `token_temp` (`umt_...`, validade curta, uso único)
2. Outro sistema: `POST /api/auth/api-tokens/trocar/` com `token_temp` + `username` + `password`
3. Recebe `token_perm` (`um_...`) e guarda no `.env`
4. Chamadas: `Authorization: Bearer um_...` (DRF `ApiKeyAuthentication` + JWT)

Gestão: listar/revogar em `/gestao/api` · catálogo em `GET /api/gestao/api-docs/catalogo/`

Detalhes: [docs/docker.md](docs/docker.md)
