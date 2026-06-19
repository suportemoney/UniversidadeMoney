# Conteúdo gestão — novos modelos e campos em Curso

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import apps.cursos.models


def migrar_status_publicado(apps, schema_editor):
    Curso = apps.get_model("cursos", "Curso")
    for curso in Curso.objects.all():
        if curso.publicado:
            curso.status = "publicado"
        else:
            curso.status = "rascunho"
        curso.save(update_fields=["status"])


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cursos", "0002_seed_dados"),
    ]

    operations = [
        migrations.AddField(
            model_name="curso",
            name="atualizado_em",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="curso",
            name="criado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cursos_criados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="curso",
            name="status",
            field=models.CharField(
                choices=[
                    ("rascunho", "Rascunho"),
                    ("publicado", "Publicado"),
                    ("arquivado", "Arquivado"),
                ],
                default="rascunho",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="curso",
            name="thumbnail",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to=apps.cursos.models.curso_thumbnail_upload_path,
            ),
        ),
        migrations.AlterField(
            model_name="curso",
            name="publicado",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="curso",
            name="trilha",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cursos_legado",
                to="cursos.trilha",
            ),
        ),
        migrations.AddField(
            model_name="trilha",
            name="descricao",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="trilha",
            name="setor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="trilhas",
                to="cursos.setor",
            ),
        ),
        migrations.CreateModel(
            name="AulaVideo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("descricao", models.TextField(blank=True)),
                ("video", models.FileField(blank=True, null=True, upload_to=apps.cursos.models.aula_video_upload_path)),
                ("duracao_segundos", models.PositiveIntegerField(default=0)),
                ("ordem", models.PositiveIntegerField(default=0)),
                ("obrigatoria", models.BooleanField(default=True)),
                ("modulo", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="aulas", to="cursos.modulo")),
            ],
            options={"verbose_name": "Aula em vídeo", "verbose_name_plural": "Aulas em vídeo", "ordering": ["ordem"]},
        ),
        migrations.CreateModel(
            name="Atividade",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("tipo", models.CharField(choices=[("quiz", "Quiz"), ("reflexao", "Reflexão")], default="quiz", max_length=20)),
                ("ordem", models.PositiveIntegerField(default=0)),
                ("obrigatoria", models.BooleanField(default=True)),
                ("modulo", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="atividades", to="cursos.modulo")),
            ],
            options={"verbose_name": "Atividade", "verbose_name_plural": "Atividades", "ordering": ["ordem"]},
        ),
        migrations.CreateModel(
            name="ProvaFinal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(default="Prova final", max_length=200)),
                ("nota_minima", models.PositiveSmallIntegerField(default=70)),
                ("tentativas_max", models.PositiveSmallIntegerField(default=3)),
                ("tempo_limite_min", models.PositiveIntegerField(blank=True, null=True)),
                ("curso", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="prova_final", to="cursos.curso")),
            ],
            options={"verbose_name": "Prova final", "verbose_name_plural": "Provas finais"},
        ),
        migrations.CreateModel(
            name="Questao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enunciado", models.TextField()),
                ("tipo", models.CharField(choices=[("multipla_escolha", "Múltipla escolha"), ("verdadeiro_falso", "Verdadeiro ou falso")], default="multipla_escolha", max_length=30)),
                ("opcoes", models.JSONField(blank=True, default=list)),
                ("resposta_correta", models.JSONField(blank=True, default=dict)),
                ("ordem", models.PositiveIntegerField(default=0)),
                ("atividade", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="questoes", to="cursos.atividade")),
                ("prova", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="questoes", to="cursos.provafinal")),
            ],
            options={"verbose_name": "Questão", "verbose_name_plural": "Questões", "ordering": ["ordem"]},
        ),
        migrations.CreateModel(
            name="ProgressoAula",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("concluida", models.BooleanField(default=False)),
                ("concluida_em", models.DateTimeField(blank=True, null=True)),
                ("aula", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="progressos", to="cursos.aulavideo")),
                ("matricula", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="progresso_aulas", to="cursos.matricula")),
            ],
            options={"verbose_name": "Progresso de aula", "verbose_name_plural": "Progressos de aula", "unique_together": {("matricula", "aula")}},
        ),
        migrations.CreateModel(
            name="TentativaAtividade",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nota", models.PositiveSmallIntegerField(default=0)),
                ("aprovado", models.BooleanField(default=False)),
                ("respostas", models.JSONField(blank=True, default=dict)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atividade", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tentativas", to="cursos.atividade")),
                ("matricula", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tentativas_atividade", to="cursos.matricula")),
            ],
            options={"verbose_name": "Tentativa de atividade", "verbose_name_plural": "Tentativas de atividade"},
        ),
        migrations.CreateModel(
            name="TentativaProva",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nota", models.PositiveSmallIntegerField(default=0)),
                ("aprovado", models.BooleanField(default=False)),
                ("respostas", models.JSONField(blank=True, default=dict)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("matricula", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tentativas_prova", to="cursos.matricula")),
                ("prova", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tentativas", to="cursos.provafinal")),
            ],
            options={"verbose_name": "Tentativa de prova", "verbose_name_plural": "Tentativas de prova"},
        ),
        migrations.RunPython(migrar_status_publicado, migrations.RunPython.noop),
    ]
