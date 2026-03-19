#!/usr/bin/env bash
set -euo pipefail

resolve_from_file() {
  local name="$1"
  local file_var="${name}_FILE"
  local file_path="${!file_var:-}"

  if [[ -z "${!name:-}" && -n "$file_path" && -r "$file_path" ]]; then
    export "$name=$(<"$file_path")"
  fi
}

resolve_from_file ALS_API_TOKEN
resolve_from_file ALS_SERVICE_TOKEN
resolve_from_file BATCH_ADMIN_TOKEN
resolve_from_file ADMIN_BATCH_TOKEN

SITE_URL="${SITE_URL:-http://127.0.0.1:${PORT:-3000}}"
BATCH_ADMIN_TOKEN="${BATCH_ADMIN_TOKEN:-${ADMIN_BATCH_TOKEN:-${ALS_API_TOKEN:-${ALS_SERVICE_TOKEN:-internal-scheduler-token}}}}"
BATCH_SERVICE_SCOPE="${BATCH_SERVICE_SCOPE:-${ALS_SERVICE_SCOPE:-}}"
BATCH_PREDICTION_HORIZON="${BATCH_PREDICTION_HORIZON:-q2-2026}"
TIMEOUT_SECONDS="${BATCH_JOB_TIMEOUT_SECONDS:-120}"

if [[ "${BATCH_ADMIN_TOKEN}" == "internal-scheduler-token" ]]; then
  echo "[nightly-batch] Using fallback token. Set BATCH_ADMIN_TOKEN for production hardening."
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[nightly-batch] curl is required." >&2
  exit 1
fi

echo "[nightly-batch] Starting run at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "[nightly-batch] SITE_URL=${SITE_URL} horizon=${BATCH_PREDICTION_HORIZON}"

common_headers=(
  -H "Authorization: Bearer ${BATCH_ADMIN_TOKEN}"
  -H "x-als-service-token: ${BATCH_ADMIN_TOKEN}"
  -H "Content-Type: application/json"
)

if [[ -n "${BATCH_SERVICE_SCOPE}" ]]; then
  common_headers+=( -H "x-als-service-scope: ${BATCH_SERVICE_SCOPE}" )
fi

snapshot_response="$(curl -fsS --max-time "${TIMEOUT_SECONDS}" -X POST "${SITE_URL}/api/admin/batch/snapshot-hydration" "${common_headers[@]}")"
echo "[nightly-batch] snapshot-hydration response: ${snapshot_response}"

prediction_response="$(curl -fsS --max-time "${TIMEOUT_SECONDS}" -X POST "${SITE_URL}/api/admin/batch/predictions?horizon=${BATCH_PREDICTION_HORIZON}" "${common_headers[@]}")"
echo "[nightly-batch] predictions response: ${prediction_response}"

echo "[nightly-batch] Completed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
