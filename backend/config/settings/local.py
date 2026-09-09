"""Configurações locais / desenvolvimento (Docker Windows)."""
import os

from .base import *  # noqa: F403

APP_ENV = os.getenv("APP_ENV", "development")
DEBUG = (
    os.getenv("DJANGO_DEBUG", os.getenv("DEBUG", "1")).lower()
    in ("1", "true", "yes")
)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "universidade_money_dev"),
        "USER": os.getenv("DB_USER", "universidade_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", "devpassword"),
        "HOST": os.getenv("DB_HOST", "db"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}
