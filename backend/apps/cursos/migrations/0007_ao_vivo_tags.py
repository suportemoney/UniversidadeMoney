# Tags em treinamentos ao vivo

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0006_tags_curso"),
    ]

    operations = [
        migrations.AddField(
            model_name="treinamentoaovivo",
            name="tags",
            field=models.ManyToManyField(
                blank=True,
                related_name="treinamentos_ao_vivo",
                to="cursos.tagcurso",
            ),
        ),
    ]
