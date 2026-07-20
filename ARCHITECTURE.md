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

### Fluxo TokenAcesso

1. Painel cria colaborador + token  
2. Interno valida token → setup senha/CPF  
3. Plataforma: login CPF + senha  

Detalhes: [docs/docker.md](docs/docker.md)
