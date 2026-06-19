"""Validadores de campos."""
import re


def normalizar_cpf(cpf: str) -> str:
    """Remove caracteres não numéricos do CPF."""
    return re.sub(r"\D", "", cpf)


def cpf_valido(cpf: str) -> bool:
    """Valida dígitos verificadores do CPF brasileiro."""
    cpf = normalizar_cpf(cpf)

    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    for i in range(9, 11):
        soma = sum(int(cpf[num]) * ((i + 1) - num) for num in range(0, i))
        digito = (soma * 10 % 11) % 10
        if int(cpf[i]) != digito:
            return False

    return True
