# Validade da confirmação de CPF no MFA (substitui cache LocMem entre workers)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_dispositivo_confiavel_mfa"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="mfa_cpf_ok_ate",
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name="CPF verificado no MFA até",
            ),
        ),
    ]
