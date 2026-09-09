# Código OTP de recuperação de senha (hash + validade)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_profile_mfa_cpf_ok_ate"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="senha_codigo_hash",
            field=models.CharField(
                blank=True,
                default="",
                max_length=64,
                verbose_name="Hash do código de recuperação",
            ),
        ),
        migrations.AddField(
            model_name="profile",
            name="senha_codigo_ate",
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name="Código de recuperação válido até",
            ),
        ),
    ]
