# Tags de curso permitidas por plano

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0006_tags_curso"),
        ("planos", "0002_seed_planos_iniciais"),
    ]

    operations = [
        migrations.AddField(
            model_name="plano",
            name="tags_cursos",
            field=models.ManyToManyField(blank=True, related_name="planos", to="cursos.tagcurso"),
        ),
    ]
