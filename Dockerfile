# ========== Stage 1: Build ==========
FROM node:20-alpine AS builder

WORKDIR /app

# Build args para variáveis do Vite (opcional; pode usar .env no build)
ARG VITE_API_URL=""
ARG VITE_SERVER_URL=""
ARG VITE_STRIPE_PUBLIC_KEY=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ========== Stage 2: Serve com nginx ==========
FROM nginx:alpine

# Remove config padrão e usa a nossa
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Cópia dos arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Script de entrypoint: substitui variáveis no nginx e inicia
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
