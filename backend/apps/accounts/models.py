"""Modelos de perfil do usuário."""
from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    cpf = models.CharField(max_length=11, unique=True, verbose_name="CPF")
    cargo = models.CharField(max_length=100, blank=True, default="Colaborador")
    setor = models.ForeignKey(
        "cursos.Setor",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="colaboradores",
        verbose_name="Setor",
    )
    is_membro_equipe = models.BooleanField(
        default=False,
        verbose_name="Membro da equipe",
    )

    class Meta:
        verbose_name = "Perfil"
        verbose_name_plural = "Perfis"

    def __str__(self):
        return f"Perfil de {self.user.email}"
