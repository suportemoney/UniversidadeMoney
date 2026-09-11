"""Garante um superuser pioneiro a partir de SUPERUSER_* (só cria senha na primeira vez)."""
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from apps.accounts.models import Profile


class Command(BaseCommand):
    help = "Cria o superuser pioneiro se SUPERUSER_USERNAME e SUPERUSER_PASSWORD estiverem definidos."

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

        if created:
            user.set_password(password)
            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.save()
        else:
            # Não sobrescreve senha já trocada pelo pioneiro
            if email and user.email != email:
                user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=["email", "is_staff", "is_superuser"])

        profile, profile_created = Profile.objects.get_or_create(
            user=user,
            defaults={
                "cargo": "Administrador",
                "is_membro_equipe": True,
                "precisa_redefinir_senha": True,
                "totp_confirmado": False,
                "nivel_acesso": Profile.NIVEL_ADMINISTRADOR,
            },
        )
        if created or profile_created:
            profile.precisa_redefinir_senha = True
            profile.totp_confirmado = False
            profile.save(update_fields=["precisa_redefinir_senha", "totp_confirmado"])

        from apps.cursos.permissions import aplicar_nivel_acesso

        aplicar_nivel_acesso(user, Profile.NIVEL_ADMINISTRADOR)

        # Superuser pioneiro não usa CPF — login só pelo username (ex.: admin)
        profile = user.profile
        if profile.cpf:
            profile.cpf = None
            profile.save(update_fields=["cpf"])

        acao = "criado" if created else "já existia (senha preservada)"
        self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' {acao}."))
