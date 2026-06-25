import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.cursos.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cursos", "0008_ao_vivo_link_plataforma"),
    ]

    operations = [
        migrations.AddField(
            model_name="curso",
            name="instrutor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cursos_instruidos",
                to=settings.AUTH_USER_MODEL,
                verbose_name="Instrutor",
            ),
        ),
        migrations.AddField(
            model_name="modulo",
            name="conteudo_texto",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="modulo",
            name="tipo",
            field=models.CharField(
                choices=[
                    ("texto", "O que você vai aprender"),
                    ("apostila", "Apostilas"),
                    ("video", "Videoaulas"),
                ],
                default="video",
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name="CursoParticipante",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=200)),
                ("cargo", models.CharField(blank=True, default="", max_length=120)),
                ("ordem", models.PositiveIntegerField(default=0)),
                (
                    "curso",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="participantes",
                        to="cursos.curso",
                    ),
                ),
            ],
            options={
                "verbose_name": "Participante do curso",
                "verbose_name_plural": "Participantes do curso",
                "ordering": ["ordem", "id"],
            },
        ),
        migrations.CreateModel(
            name="ModuloArquivo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                (
                    "tipo",
                    models.CharField(
                        choices=[("pdf", "PDF"), ("audio", "Áudio")],
                        default="pdf",
                        max_length=10,
                    ),
                ),
                (
                    "arquivo",
                    models.FileField(
                        blank=True,
                        null=True,
                        upload_to=apps.cursos.models.modulo_arquivo_upload_path,
                    ),
                ),
                ("ordem", models.PositiveIntegerField(default=0)),
                (
                    "modulo",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="arquivos",
                        to="cursos.modulo",
                    ),
                ),
            ],
            options={
                "verbose_name": "Arquivo do módulo",
                "verbose_name_plural": "Arquivos do módulo",
                "ordering": ["ordem"],
            },
        ),
        migrations.CreateModel(
            name="ProgressoModuloTexto",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("concluida", models.BooleanField(default=False)),
                ("concluida_em", models.DateTimeField(blank=True, null=True)),
                (
                    "matricula",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progresso_modulos_texto",
                        to="cursos.matricula",
                    ),
                ),
                (
                    "modulo",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progressos_texto",
                        to="cursos.modulo",
                    ),
                ),
            ],
            options={
                "verbose_name": "Progresso de módulo texto",
                "verbose_name_plural": "Progressos de módulo texto",
                "unique_together": {("matricula", "modulo")},
            },
        ),
        migrations.CreateModel(
            name="ProgressoModuloArquivo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("concluida", models.BooleanField(default=False)),
                ("concluida_em", models.DateTimeField(blank=True, null=True)),
                (
                    "arquivo",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progressos",
                        to="cursos.moduloarquivo",
                    ),
                ),
                (
                    "matricula",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progresso_modulos_arquivo",
                        to="cursos.matricula",
                    ),
                ),
            ],
            options={
                "verbose_name": "Progresso de arquivo do módulo",
                "verbose_name_plural": "Progressos de arquivo do módulo",
                "unique_together": {("matricula", "arquivo")},
            },
        ),
    ]
