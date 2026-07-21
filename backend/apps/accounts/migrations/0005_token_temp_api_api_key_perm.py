# TokenTempApi + ApiKeyPerm (integração)

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0004_token_acesso_cpf_nullable"),
    ]

    operations = [
        migrations.CreateModel(
            name="TokenTempApi",
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
                ("prefix", models.CharField(db_index=True, max_length=16)),
                ("key_hash", models.CharField(max_length=64, unique=True)),
                ("valido_ate", models.DateTimeField()),
                ("usado_em", models.DateTimeField(blank=True, null=True)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "criado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="tokens_temp_api_criados",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Token API temporário",
                "verbose_name_plural": "Tokens API temporários",
                "ordering": ["-criado_em"],
            },
        ),
        migrations.CreateModel(
            name="ApiKeyPerm",
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
                ("nome", models.CharField(blank=True, default="", max_length=120)),
                ("prefix", models.CharField(db_index=True, max_length=16)),
                ("key_hash", models.CharField(max_length=64, unique=True)),
                ("valido_ate", models.DateTimeField(blank=True, null=True)),
                ("revogado_em", models.DateTimeField(blank=True, null=True)),
                ("ultimo_uso", models.DateTimeField(blank=True, null=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "criado_por",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="api_keys_criadas",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "usuario",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="api_keys_perm",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "API Key permanente",
                "verbose_name_plural": "API Keys permanentes",
                "ordering": ["-criado_em"],
            },
        ),
    ]
