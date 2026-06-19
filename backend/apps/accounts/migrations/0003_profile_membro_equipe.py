# Perfil — membro da equipe de gestão

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_profile_cargo_setor"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="is_membro_equipe",
            field=models.BooleanField(default=False, verbose_name="Membro da equipe"),
        ),
    ]
