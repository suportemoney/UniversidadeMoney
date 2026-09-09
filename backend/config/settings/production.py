"""Configurações de produção (VPS)."""
import os

from .base import *  # noqa: F403

DEBUG = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "universidade_money"),
        "USER": os.getenv("DB_USER", "universidade_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Static via WhiteNoise (nginx do EducaMoney faz proxy /static/ para este backend)
_mw = list(MIDDLEWARE)
if "whitenoise.middleware.WhiteNoiseMiddleware" not in _mw:
    _mw.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
MIDDLEWARE = _mw

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}
