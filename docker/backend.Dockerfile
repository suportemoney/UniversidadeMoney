FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
        ffmpeg \
        libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY backend/ /app/
COPY docker/entrypoint-backend.sh /entrypoint-backend.sh

RUN sed -i 's/\r$//' /entrypoint-backend.sh \
    && chmod +x /entrypoint-backend.sh \
    && mkdir -p /data/static /data/media

EXPOSE 8000

ENTRYPOINT ["/entrypoint-backend.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "1200", "--graceful-timeout", "60"]
