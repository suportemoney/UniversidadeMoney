# Perfil — cargo e setor

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="cargo",
            field=models.CharField(blank=True, default="Colaborador", max_length=100),
        ),
        migrations.AddField(
            model_name="profile",
            name="setor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="colaboradores",
                to="cursos.setor",
                verbose_name="Setor",
            ),
        ),
    ]
