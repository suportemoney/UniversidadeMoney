import apps.landing.models
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="FaixaPromocional",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("mensagem", models.CharField(max_length=300)),
                ("texto_botao", models.CharField(blank=True, max_length=80)),
                ("url_botao", models.CharField(blank=True, max_length=500)),
                ("exibir_countdown", models.BooleanField(default=False)),
                ("data_fim_countdown", models.DateTimeField(blank=True, null=True)),
                ("ativo", models.BooleanField(default=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Faixa promocional",
                "verbose_name_plural": "Faixas promocionais",
            },
        ),
        migrations.CreateModel(
            name="BannerLanding",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(blank=True, max_length=200)),
                ("subtitulo", models.CharField(blank=True, max_length=300)),
                ("link", models.CharField(blank=True, max_length=500)),
                ("imagem", models.FileField(blank=True, upload_to=apps.landing.models.banner_gif_upload_path)),
                ("ordem", models.PositiveIntegerField(default=0)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Banner da landing",
                "verbose_name_plural": "Banners da landing",
                "ordering": ["ordem", "id"],
            },
        ),
    ]
