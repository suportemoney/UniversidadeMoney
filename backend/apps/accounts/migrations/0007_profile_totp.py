# MFA TOTP no Profile

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_profile_nivel_acesso"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="totp_secret",
            field=models.CharField(
                blank=True, default="", max_length=64, verbose_name="Segredo TOTP"
            ),
        ),
        migrations.AddField(
            model_name="profile",
            name="totp_confirmado",
            field=models.BooleanField(default=False, verbose_name="TOTP confirmado"),
        ),
    ]
