# Dev Vite — FRONTEND_DIR + comando via env
FROM node:20-alpine

ARG FRONTEND_DIR=frontend-plataforma
WORKDIR /app

COPY ${FRONTEND_DIR}/package.json ${FRONTEND_DIR}/package-lock.json ./
RUN npm ci

COPY ${FRONTEND_DIR}/ ./
# Tokens/tema compartilhados (alias @shared → /shared)
COPY shared/ /shared/

ENV SHARED_UI_ROOT=/shared

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
