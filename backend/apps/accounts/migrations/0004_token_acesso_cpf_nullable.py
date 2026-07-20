# Profile CPF nullable + precisa_redefinir_senha + TokenAcesso

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.accounts.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0003_profile_membro_equipe"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="cpf",
            field=models.CharField(
                blank=True,
                max_length=11,
                null=True,
                unique=True,
                verbose_name="CPF",
            ),
        ),
        migrations.AddField(
            model_name="profile",
            name="precisa_redefinir_senha",
            field=models.BooleanField(
                default=False,
                verbose_name="Precisa redefinir senha",
            ),
        ),
        migrations.CreateModel(
            name="TokenAcesso",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "chave",
                    models.CharField(
                        db_index=True,
                        default=apps.accounts.models.gerar_chave_token_acesso,
                        max_length=40,
                        unique=True,
                    ),
                ),
                ("ativo", models.BooleanField(default=True)),
                ("usado_em", models.DateTimeField(blank=True, null=True)),
                ("valido_ate", models.DateTimeField(blank=True, null=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "criado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="tokens_acesso_criados",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "usuario",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tokens_acesso",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Token de acesso",
                "verbose_name_plural": "Tokens de acesso",
                "ordering": ["-criado_em"],
            },
        ),
    ]
