# Biblioteca PDF, inscrições ao vivo e leitura de comunicados

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.cursos.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cursos", "0004_trilha_cursos_m2m"),
    ]

    operations = [
        migrations.CreateModel(
            name="MaterialBiblioteca",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("descricao", models.TextField(blank=True)),
                ("arquivo", models.FileField(blank=True, null=True, upload_to=apps.cursos.models.biblioteca_upload_path)),
                ("publicado", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="materiais", to="cursos.setor")),
            ],
            options={"verbose_name": "Material da biblioteca", "verbose_name_plural": "Materiais da biblioteca", "ordering": ["-criado_em"]},
        ),
        migrations.CreateModel(
            name="InscricaoAoVivo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("treinamento", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="inscricoes", to="cursos.treinamentoaovivo")),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="inscricoes_ao_vivo", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "Inscrição ao vivo", "verbose_name_plural": "Inscrições ao vivo", "unique_together": {("usuario", "treinamento")}},
        ),
        migrations.CreateModel(
            name="ComunicadoLeitura",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("lido_em", models.DateTimeField(auto_now_add=True)),
                ("comunicado", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="leituras", to="cursos.comunicado")),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comunicados_lidos", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "Leitura de comunicado", "verbose_name_plural": "Leituras de comunicados", "unique_together": {("usuario", "comunicado")}},
        ),
    ]
