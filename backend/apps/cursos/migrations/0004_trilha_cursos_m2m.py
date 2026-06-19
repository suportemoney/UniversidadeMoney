# Trilha — relação M2M com cursos via TrilhaCurso

import django.db.models.deletion
from django.db import migrations, models


def migrar_trilhas_legado(apps, schema_editor):
    Curso = apps.get_model("cursos", "Curso")
    TrilhaCurso = apps.get_model("cursos", "TrilhaCurso")
    for curso in Curso.objects.exclude(trilha_id__isnull=True):
        TrilhaCurso.objects.get_or_create(
            trilha_id=curso.trilha_id,
            curso_id=curso.id,
            defaults={"ordem": curso.id},
        )


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0003_conteudo_gestao"),
    ]

    operations = [
        migrations.CreateModel(
            name="TrilhaCurso",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ordem", models.PositiveIntegerField(default=0)),
                ("curso", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="trilha_itens", to="cursos.curso")),
                ("trilha", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="itens", to="cursos.trilha")),
            ],
            options={
                "verbose_name": "Curso na trilha",
                "verbose_name_plural": "Cursos na trilha",
                "ordering": ["ordem"],
                "unique_together": {("trilha", "curso")},
            },
        ),
        migrations.RunPython(migrar_trilhas_legado, migrations.RunPython.noop),
    ]
