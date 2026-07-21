# Profile.nivel_acesso + migração de flags existentes

from django.db import migrations, models


def popular_nivel_acesso(apps, schema_editor):
    Profile = apps.get_model("accounts", "Profile")
    for profile in Profile.objects.select_related("user").all():
        user = profile.user
        if user.is_superuser:
            profile.nivel_acesso = "administrador"
        elif profile.is_membro_equipe:
            profile.nivel_acesso = "gestor"
        else:
            profile.nivel_acesso = "padrao"
        profile.save(update_fields=["nivel_acesso"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_token_temp_api_api_key_perm"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="nivel_acesso",
            field=models.CharField(
                choices=[
                    ("padrao", "Padrão"),
                    ("instrutor", "Instrutor"),
                    ("gestor", "Gestor"),
                    ("administrador", "Administrador"),
                ],
                default="padrao",
                max_length=20,
                verbose_name="Nível de acesso",
            ),
        ),
        migrations.RunPython(popular_nivel_acesso, migrations.RunPython.noop),
    ]
