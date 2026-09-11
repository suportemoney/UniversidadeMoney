"""Envio de e-mail transacional (SMTP Hostinger). Falha não interrompe o fluxo."""
import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

MENSAGEM_GENERICA_RECUPERACAO = (
    "Se houver uma conta com e-mail cadastrado, enviaremos um código."
)


def mascarar_email(email):
    """Ex.: suporte.moneypromotora@gmail.com → supo**********ora@gmail.com."""
    bruto = (email or "").strip()
    if "@" not in bruto:
        return ""
    local, _, dominio = bruto.partition("@")
    if not local or not dominio:
        return ""
    if len(local) >= 7:
        visivel = f"{local[:4]}**********{local[-3:]}"
    elif len(local) >= 2:
        visivel = f"{local[0]}**********{local[-1]}"
    else:
        visivel = f"{local}**********"
    return f"{visivel}@{dominio}"


def url_site(caminho="/"):
    """URL pública da plataforma (dev = localhost, senão HTTPS do domínio)."""
    caminho = caminho if caminho.startswith("/") else f"/{caminho}"
    if os_getenv_dev():
        if caminho.startswith("/interno"):
            return f"http://localhost:5175{caminho[len('/interno'):] or '/'}"
        if caminho.startswith("/painel"):
            return f"http://localhost:5174{caminho[len('/painel'):] or '/'}"
        return f"http://localhost:5173{caminho}"
    dominio = getattr(settings, "VPS_DOMAIN", "universidade.moneypromotora.com.br")
    return f"https://{dominio}{caminho}"


def os_getenv_dev():
    return getattr(settings, "APP_ENV", "production") == "development"


def enviar_email(assunto, corpo, destinatarios):
    """
    Envia texto simples a partir de DEFAULT_FROM_EMAIL.
    Retorna True se enviou; False se não havia destino ou o SMTP falhou.
    """
    destinos = []
    for item in destinatarios or []:
        email = (item or "").strip()
        if email:
            destinos.append(email)
    if not destinos:
        return False
    if not getattr(settings, "EMAIL_HOST_PASSWORD", ""):
        logger.warning("SMTP sem EMAIL_HOST_PASSWORD — e-mail não enviado: %s", assunto)
        return False
    try:
        send_mail(
            subject=assunto,
            message=corpo,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=destinos,
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception("Falha ao enviar e-mail: %s → %s", assunto, destinos)
        return False
