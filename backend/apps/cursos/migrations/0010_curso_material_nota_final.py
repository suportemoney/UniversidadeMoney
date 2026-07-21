# Generated manually for CursoMaterial + Matricula notas

from django.db import migrations, models
import django.db.models.deletion
import apps.cursos.models


def migrar_apostilas_para_materiais(apps, schema_editor):
    """Move PDFs de módulos apostila para materiais do curso."""
    Modulo = apps.get_model("cursos", "Modulo")
    ModuloArquivo = apps.get_model("cursos", "ModuloArquivo")
    CursoMaterial = apps.get_model("cursos", "CursoMaterial")

    for modulo in Modulo.objects.filter(tipo="apostila"):
        ordem = 0
        for arq in ModuloArquivo.objects.filter(modulo=modulo, tipo="pdf"):
            if not arq.arquivo:
                continue
            CursoMaterial.objects.create(
                curso_id=modulo.curso_id,
                titulo=arq.titulo or f"Material — {modulo.titulo}",
                arquivo=arq.arquivo,
                ordem=ordem,
            )
            ordem += 1


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0009_modulos_tipados_instrutor"),
    ]

    operations = [
        migrations.CreateModel(
            name="CursoMaterial",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(max_length=200)),
                ("arquivo", models.FileField(blank=True, null=True, upload_to=apps.cursos.models.curso_material_upload_path)),
                ("ordem", models.PositiveIntegerField(default=0)),
                (
                    "curso",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="materiais",
                        to="cursos.curso",
                    ),
                ),
            ],
            options={
                "verbose_name": "Material do curso",
                "verbose_name_plural": "Materiais do curso",
                "ordering": ["ordem", "id"],
            },
        ),
        migrations.AddField(
            model_name="matricula",
            name="certificado_liberado",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="matricula",
            name="nota_final",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(migrar_apostilas_para_materiais, migrations.RunPython.noop),
    ]
