# Remove 2FA (TOTP, confirmação de CPF do MFA e dispositivos confiáveis).

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0010_profile_senha_codigo"),
    ]

    operations = [
        migrations.DeleteModel(name="DispositivoConfiavelMfa"),
        migrations.RemoveField(model_name="profile", name="totp_secret"),
        migrations.RemoveField(model_name="profile", name="totp_confirmado"),
        migrations.RemoveField(model_name="profile", name="mfa_cpf_ok_ate"),
    ]
