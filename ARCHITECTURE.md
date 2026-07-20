## Arquitetura — UniversidadeMoney

### Ambientes e superfícies

| Superfície | Host produção | App |
|------------|---------------|-----|
| Interno (token-key) | `interno.moneypromotora.com.br` | `frontend-plataforma` modo `interno` |
| Plataforma | `plataforma.moneypromotora.com.br` | `frontend-plataforma` modo `plataforma` |
| Painel | `painel-interno.moneypromotora.com.br` | `frontend-painel` |

Homolog: `*-hml.moneypromotora.com.br`.

### Fluxo TokenAcesso

1. Painel cria colaborador + `TokenAcesso` (senha inicial `123456`)
2. Colaborador abre **interno** e informa token-key
3. API valida via ORM (sem SQL raw), mostra username + senha padrão
4. Colaborador redefine senha + CPF
5. Redirect para **plataforma** (login CPF + senha)

### Stack Docker

- PostgreSQL, Django/Gunicorn, 3 frontends nginx por ambiente, gateway + certbot
- Dev: `compose.dev.yml` (portas 5173 plataforma, 5174 painel, 5175 interno)

### Estrutura

```
backend/
frontend-plataforma/
frontend-painel/
docker/
compose.yml / compose.dev.yml / compose.vps.yml
```

Detalhes: [docs/docker.md](docs/docker.md) · [README.md](README.md)
