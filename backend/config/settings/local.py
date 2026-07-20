"""Configurações locais / desenvolvimento (Docker Windows)."""
import os

from .base import *  # noqa: F403

APP_ENV = os.getenv("APP_ENV", "development")
DEBUG = APP_ENV == "development" or os.getenv("DEBUG", "1") == "1"

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
