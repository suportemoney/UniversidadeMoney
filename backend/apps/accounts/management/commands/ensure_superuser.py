"""Garante um superuser a partir de variáveis de ambiente (idempotente)."""
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from apps.accounts.models import Profile


class Command(BaseCommand):
    help = "Cria ou atualiza superuser se SUPERUSER_USERNAME e SUPERUSER_PASSWORD estiverem definidos."

    def handle(self, *args, **options):
        username = (os.getenv("SUPERUSER_USERNAME") or "").strip()
        password = os.getenv("SUPERUSER_PASSWORD") or ""
        email = (os.getenv("SUPERUSER_EMAIL") or "").strip() or f"{username}@localhost"

        if not username or not password:
            self.stdout.write("SUPERUSER_* não definido — pulando.")
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        Profile.objects.get_or_create(
            user=user,
            defaults={
                "cargo": "Administrador",
                "is_membro_equipe": True,
                "precisa_redefinir_senha": False,
                "nivel_acesso": Profile.NIVEL_ADMINISTRADOR,
            },
        )
        from apps.cursos.permissions import aplicar_nivel_acesso

        aplicar_nivel_acesso(user, Profile.NIVEL_ADMINISTRADOR)

        # CPF opcional via env (superuser não passa por convite)
        cpf_env = (os.getenv("SUPERUSER_CPF") or "").strip()
        if cpf_env:
            from apps.accounts.validators import cpf_valido, normalizar_cpf

            cpf_norm = normalizar_cpf(cpf_env)
            if cpf_valido(cpf_norm):
                profile = user.profile
                if not profile.cpf:
                    if not Profile.objects.filter(cpf=cpf_norm).exclude(user=user).exists():
                        profile.cpf = cpf_norm
                        profile.save(update_fields=["cpf"])

        acao = "criado" if created else "atualizado"
        self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' {acao}."))
