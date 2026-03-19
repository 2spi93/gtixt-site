#!/usr/bin/env bash
set -euo pipefail

SECRETS_DIR="${SECRETS_DIR:-/run/secrets/gpti-site}"
NGINX_CONF_SRC="${NGINX_CONF_SRC:-/opt/gpti/gpti-site/ops/nginx/minio-api-9003.conf}"
NGINX_CONF_DST="${NGINX_CONF_DST:-/etc/nginx/conf.d/gpti-minio-api-9003.conf}"
APP_RUNTIME_USER="${APP_RUNTIME_USER:-deploy}"
APP_RUNTIME_GROUP="${APP_RUNTIME_GROUP:-$APP_RUNTIME_USER}"

mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

touch "$SECRETS_DIR/als_api_token"
touch "$SECRETS_DIR/minio_access_key"
touch "$SECRETS_DIR/minio_secret_key"
touch "$SECRETS_DIR/database_url"
touch "$SECRETS_DIR/openai_api_key"
touch "$SECRETS_DIR/oss_llm_api_key"
touch "$SECRETS_DIR/slack_webhook_url"
touch "$SECRETS_DIR/redis_password"
touch "$SECRETS_DIR/llm_api_key"
touch "$SECRETS_DIR/smtp_pass"
touch "$SECRETS_DIR/brevo_api_key"

chmod 600 \
  "$SECRETS_DIR/als_api_token" \
  "$SECRETS_DIR/minio_access_key" \
  "$SECRETS_DIR/minio_secret_key" \
  "$SECRETS_DIR/database_url" \
  "$SECRETS_DIR/openai_api_key" \
  "$SECRETS_DIR/oss_llm_api_key" \
  "$SECRETS_DIR/slack_webhook_url" \
  "$SECRETS_DIR/redis_password" \
  "$SECRETS_DIR/llm_api_key" \
  "$SECRETS_DIR/smtp_pass" \
  "$SECRETS_DIR/brevo_api_key"

if id "$APP_RUNTIME_USER" >/dev/null 2>&1; then
  chown "$APP_RUNTIME_USER:$APP_RUNTIME_GROUP" "$SECRETS_DIR"
  chown "$APP_RUNTIME_USER:$APP_RUNTIME_GROUP" "$SECRETS_DIR"/*
fi

if command -v nginx >/dev/null 2>&1; then
  cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
  nginx -t
  if command -v systemctl >/dev/null 2>&1; then
    systemctl reload nginx
  else
    nginx -s reload
  fi
fi

cat <<EOF
Runtime secret files ready:
  $SECRETS_DIR/als_api_token
  $SECRETS_DIR/minio_access_key
  $SECRETS_DIR/minio_secret_key
  $SECRETS_DIR/database_url
  $SECRETS_DIR/openai_api_key
  $SECRETS_DIR/oss_llm_api_key
  $SECRETS_DIR/slack_webhook_url
  $SECRETS_DIR/redis_password
  $SECRETS_DIR/llm_api_key
  $SECRETS_DIR/smtp_pass
  $SECRETS_DIR/brevo_api_key

If nginx is installed, dedicated MinIO API endpoint is configured at:
  http://127.0.0.1:9003 -> http://127.0.0.1:9000
EOF