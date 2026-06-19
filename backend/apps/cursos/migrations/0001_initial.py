# Migration inicial — modelos de cursos

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
            name="Setor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=100)),
                ("slug", models.SlugField(unique=True)),
                ("icone", models.CharField(blank=True, default="📁", max_length=8)),
                ("ordem", models.PositiveIntegerField(default=0)),
            ],
            options={"verbose_name": "Setor", "verbose_name_plural": "Setores", "ordering": ["ordem", "nome"]},
        ),
        migrations.CreateModel(
            name="Trilha",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("setor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="trilhas", to="cursos.setor")),
            ],
            options={"verbose_name": "Trilha", "verbose_name_plural": "Trilhas"},
        ),
        migrations.CreateModel(
            name="Curso",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("descricao", models.TextField(blank=True)),
                ("duracao_horas", models.DecimalField(decimal_places=1, default=0, max_digits=6)),
                ("total_modulos", models.PositiveIntegerField(default=0)),
                ("is_novo", models.BooleanField(default=False)),
                ("publicado", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cursos", to="cursos.setor")),
                ("trilha", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cursos", to="cursos.trilha")),
            ],
            options={"verbose_name": "Curso", "verbose_name_plural": "Cursos", "ordering": ["-criado_em"]},
        ),
        migrations.CreateModel(
            name="Comunicado",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("conteudo", models.TextField()),
                ("tipo", models.CharField(choices=[("info", "Informação"), ("trofeu", "Conquista"), ("megafone", "Aviso")], default="info", max_length=20)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={"verbose_name": "Comunicado", "verbose_name_plural": "Comunicados", "ordering": ["-criado_em"]},
        ),
        migrations.CreateModel(
            name="TreinamentoAoVivo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("data", models.DateField()),
                ("hora", models.TimeField()),
                ("descricao", models.TextField(blank=True)),
                ("setor", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="treinamentos", to="cursos.setor")),
            ],
            options={"verbose_name": "Treinamento ao vivo", "verbose_name_plural": "Treinamentos ao vivo", "ordering": ["data", "hora"]},
        ),
        migrations.CreateModel(
            name="Modulo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("ordem", models.PositiveIntegerField(default=0)),
                ("duracao_minutos", models.PositiveIntegerField(default=0)),
                ("curso", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="modulos", to="cursos.curso")),
            ],
            options={"verbose_name": "Módulo", "verbose_name_plural": "Módulos", "ordering": ["ordem"]},
        ),
        migrations.CreateModel(
            name="Matricula",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("progresso", models.PositiveSmallIntegerField(default=0)),
                ("concluido_em", models.DateTimeField(blank=True, null=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("curso", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="matriculas", to="cursos.curso")),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="matriculas", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "Matrícula", "verbose_name_plural": "Matrículas", "unique_together": {("usuario", "curso")}},
        ),
        migrations.CreateModel(
            name="Certificado",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("emitido_em", models.DateTimeField(auto_now_add=True)),
                ("curso", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="certificados", to="cursos.curso")),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="certificados", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "Certificado", "verbose_name_plural": "Certificados", "unique_together": {("usuario", "curso")}},
        ),
        migrations.CreateModel(
            name="Conquista",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField()),
                ("titulo", models.CharField(max_length=100)),
                ("emitido_em", models.DateTimeField(auto_now_add=True)),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="conquistas", to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "Conquista", "verbose_name_plural": "Conquistas", "unique_together": {("usuario", "slug")}},
        ),
    ]
