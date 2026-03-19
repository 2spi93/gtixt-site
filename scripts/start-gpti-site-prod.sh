#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production.local}"
PORT="${PORT:-3000}"

cd "$ROOT_DIR"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

resolve_from_file() {
  local name="$1"
  local file_var="${name}_FILE"
  local file_path="${!file_var:-}"

  if [[ -z "${!name:-}" && -n "$file_path" && -r "$file_path" ]]; then
    export "$name=$(<"$file_path")"
  fi
}

# Sensitive vars that may be provided via *_FILE.
for var_name in \
  ALS_API_TOKEN \
  MINIO_ACCESS_KEY \
  MINIO_SECRET_KEY \
  DATABASE_URL \
  REDIS_PASSWORD \
  OPENAI_API_KEY \
  LLM_API_KEY \
  OSS_LLM_API_KEY \
  SMTP_PASS \
  BREVO_API_KEY \
  SLACK_WEBHOOK_URL
do
  resolve_from_file "$var_name"
done

export NODE_ENV="${NODE_ENV:-production}"
export PORT

echo "[gpti-site] Starting production server on port $PORT"
exec "$ROOT_DIR/node_modules/.bin/next" start -p "$PORT"
