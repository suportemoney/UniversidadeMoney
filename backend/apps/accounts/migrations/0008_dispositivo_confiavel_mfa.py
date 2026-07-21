# Dispositivo confiável MFA (pular TOTP por N dias)

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0007_profile_totp"),
    ]

    operations = [
        migrations.CreateModel(
            name="DispositivoConfiavelMfa",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token_hash", models.CharField(db_index=True, max_length=64, unique=True)),
                ("user_agent", models.CharField(blank=True, default="", max_length=255)),
                ("valido_ate", models.DateTimeField()),
                ("ultimo_uso", models.DateTimeField(blank=True, null=True)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "usuario",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="dispositivos_mfa",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Dispositivo confiável MFA",
                "verbose_name_plural": "Dispositivos confiáveis MFA",
                "ordering": ["-criado_em"],
            },
        ),
    ]
