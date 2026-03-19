#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_NAME="${APP_NAME:-gpti-site}"
PORT="${PORT:-3005}"

cd "$ROOT_DIR"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy-prod-pm2] Error: pm2 is not installed or not in PATH." >&2
  echo "Install with: npm i -g pm2" >&2
  exit 1
fi

echo "[deploy-prod-pm2] Deploying $APP_NAME via PM2 + canonical launcher..."

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.js --only "$APP_NAME" --env production
fi

pm2 save >/dev/null 2>&1 || true

# Run end-to-end health checks (public + ALS + uploaded=true + MinIO)
bash "$ROOT_DIR/scripts/health-check-post-deploy.sh" "$PORT"

echo "[deploy-prod-pm2] Deployment successful."
