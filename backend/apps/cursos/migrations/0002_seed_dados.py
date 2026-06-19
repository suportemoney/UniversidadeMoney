# Dados iniciais — setores, cursos e comunicados

from django.db import migrations

from apps.cursos.seed_data import seed_dados, unseed_dados


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_dados, unseed_dados),
    ]
