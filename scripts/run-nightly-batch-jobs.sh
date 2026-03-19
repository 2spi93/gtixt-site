#!/usr/bin/env bash
set -euo pipefail

SITE_URL="${SITE_URL:-http://127.0.0.1:${PORT:-3000}}"
BATCH_ADMIN_TOKEN="${BATCH_ADMIN_TOKEN:-${ADMIN_BATCH_TOKEN:-}}"
BATCH_PREDICTION_HORIZON="${BATCH_PREDICTION_HORIZON:-q2-2026}"
TIMEOUT_SECONDS="${BATCH_JOB_TIMEOUT_SECONDS:-120}"

if [[ -z "${BATCH_ADMIN_TOKEN}" ]]; then
  echo "[nightly-batch] Missing BATCH_ADMIN_TOKEN (or ADMIN_BATCH_TOKEN)." >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[nightly-batch] curl is required." >&2
  exit 1
fi

echo "[nightly-batch] Starting run at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "[nightly-batch] SITE_URL=${SITE_URL} horizon=${BATCH_PREDICTION_HORIZON}"

common_headers=(
  -H "Authorization: Bearer ${BATCH_ADMIN_TOKEN}"
  -H "Content-Type: application/json"
)

snapshot_response="$(curl -fsS --max-time "${TIMEOUT_SECONDS}" -X POST "${SITE_URL}/api/admin/batch/snapshot-hydration" "${common_headers[@]}")"
echo "[nightly-batch] snapshot-hydration response: ${snapshot_response}"

prediction_response="$(curl -fsS --max-time "${TIMEOUT_SECONDS}" -X POST "${SITE_URL}/api/admin/batch/predictions?horizon=${BATCH_PREDICTION_HORIZON}" "${common_headers[@]}")"
echo "[nightly-batch] predictions response: ${prediction_response}"

echo "[nightly-batch] Completed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
