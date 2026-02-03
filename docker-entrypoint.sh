#!/bin/sh
set -e

# Valor padrão do backend (Docker Desktop / Mac/Windows)
export BACKEND_URL="${BACKEND_URL:-http://host.docker.internal:5000}"

# Substitui variáveis no template do nginx
envsubst '${BACKEND_URL}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
