# Build SPA (plataforma / interno / painel)
# ARGs: FRONTEND_DIR, BUILD_COMMAND, VITE_*
FROM node:20-alpine AS build

WORKDIR /app

ARG FRONTEND_DIR=frontend-plataforma
COPY ${FRONTEND_DIR}/package.json ${FRONTEND_DIR}/package-lock.json ./
RUN npm ci

COPY ${FRONTEND_DIR}/ ./

ARG VITE_API_URL=/api
ARG VITE_SURFACE=plataforma
ARG VITE_PLATAFORMA_URL=
ARG VITE_INTERNO_URL=
ARG VITE_PAINEL_URL=
ARG BUILD_COMMAND=npm run build

ENV VITE_API_URL=$VITE_API_URL \
    VITE_SURFACE=$VITE_SURFACE \
    VITE_PLATAFORMA_URL=$VITE_PLATAFORMA_URL \
    VITE_INTERNO_URL=$VITE_INTERNO_URL \
    VITE_PAINEL_URL=$VITE_PAINEL_URL

RUN sh -c "$BUILD_COMMAND"

FROM nginx:1.27-alpine

COPY docker/nginx/frontend-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
