"""
Configurações locais (referência).

A execução real ocorre na VPS. Este módulo espelha produção para consulta
e eventual teste com túnel SSH ao PostgreSQL da VPS.
"""
from .production import *  # noqa: F403
