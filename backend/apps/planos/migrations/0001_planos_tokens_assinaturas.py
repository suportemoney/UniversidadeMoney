# Planos, tokens e assinaturas

import apps.planos.models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Plano",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=100)),
                ("slug", models.SlugField(unique=True)),
                ("descricao", models.TextField(blank=True)),
                ("ativo", models.BooleanField(default=True)),
                ("acesso_cursos", models.BooleanField(default=True)),
                ("acesso_trilhas", models.BooleanField(default=False)),
                ("acesso_biblioteca", models.BooleanField(default=False)),
                ("acesso_ao_vivo", models.BooleanField(default=False)),
                ("acesso_certificados", models.BooleanField(default=True)),
                ("acesso_ranking", models.BooleanField(default=False)),
                ("acesso_comunicados", models.BooleanField(default=False)),
                ("acesso_progresso", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={"verbose_name": "Plano", "verbose_name_plural": "Planos", "ordering": ["titulo"]},
        ),
        migrations.CreateModel(
            name="TokenPlano",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("chave", models.CharField(default=apps.planos.models.gerar_chave_token, max_length=32, unique=True)),
                ("max_usos", models.PositiveIntegerField(default=1)),
                ("usos_realizados", models.PositiveIntegerField(default=0)),
                ("tipo_expiracao", models.CharField(
                    choices=[("data_fixa", "Data fixa"), ("duracao", "Duração a partir do resgate")],
                    default="duracao",
                    max_length=20,
                )),
                ("data_fim", models.DateTimeField(blank=True, null=True)),
                ("duracao_dias", models.PositiveIntegerField(blank=True, null=True)),
                ("valido_ate_resgate", models.DateTimeField(blank=True, null=True)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("criado_por", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="tokens_criados", to=settings.AUTH_USER_MODEL,
                )),
                ("plano", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name="tokens", to="planos.plano",
                )),
            ],
            options={"verbose_name": "Token de plano", "verbose_name_plural": "Tokens de plano", "ordering": ["-criado_em"]},
        ),
        migrations.CreateModel(
            name="AssinaturaUsuario",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ativado_em", models.DateTimeField(auto_now_add=True)),
                ("expira_em", models.DateTimeField()),
                ("status", models.CharField(
                    choices=[("ativa", "Ativa"), ("expirada", "Expirada"), ("cancelada", "Cancelada")],
                    default="ativa",
                    max_length=20,
                )),
                ("plano", models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT, related_name="assinaturas", to="planos.plano",
                )),
                ("token", models.ForeignKey(
                    blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                    related_name="resgates", to="planos.tokenplano",
                )),
                ("usuario", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, related_name="assinaturas",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "verbose_name": "Assinatura do usuário",
                "verbose_name_plural": "Assinaturas dos usuários",
                "ordering": ["-ativado_em"],
            },
        ),
    ]
