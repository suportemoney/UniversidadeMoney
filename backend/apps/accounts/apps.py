from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    verbose_name = "Contas"

    def ready(self):
        # Registra signals (revogação de API Key ao inativar usuário)
        from . import signals  # noqa: F401
