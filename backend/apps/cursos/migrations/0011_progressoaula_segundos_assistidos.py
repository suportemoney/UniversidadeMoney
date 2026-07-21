# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0010_curso_material_nota_final"),
    ]

    operations = [
        migrations.AddField(
            model_name="progressoaula",
            name="segundos_assistidos",
            field=models.FloatField(default=0),
        ),
    ]
