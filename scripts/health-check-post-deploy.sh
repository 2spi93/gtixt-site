#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# GTIXT – Post-deploy health check
# Usage: bash scripts/health-check-post-deploy.sh [PORT] [ALS_TOKEN]
#   PORT       default: 3000
#   ALS_TOKEN  default: reads /run/secrets/gpti-site/als_api_token
# Exit codes: 0 = all checks passed, 1 = one or more checks failed
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

PORT="${1:-${PORT:-3000}}"
BASE="http://127.0.0.1:${PORT}"
MAX_WAIT="${MAX_WAIT:-30}"   # seconds to wait for service to come up
TIMEOUT=10

# ── Resolve ALS token ────────────────────────────────────────────────
if [[ -n "${2:-}" ]]; then
  ALS_TOKEN="$2"
elif [[ -n "${ALS_API_TOKEN:-}" ]]; then
  ALS_TOKEN="$ALS_API_TOKEN"
elif [[ -r /run/secrets/gpti-site/als_api_token ]]; then
  ALS_TOKEN="$(</run/secrets/gpti-site/als_api_token)"
else
  ALS_TOKEN=""
fi

# ── Colors ───────────────────────────────────────────────────────────
GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; YELLOW=$'\033[1;33m'
CYAN=$'\033[0;36m'; BOLD=$'\033[1m'; RESET=$'\033[0m'

pass() { echo "${GREEN}✔${RESET}  $*"; }
fail() { echo "${RED}✘${RESET}  $*"; FAILED=$((FAILED+1)); }
info() { echo "${CYAN}ℹ${RESET}  $*"; }

FAILED=0
CHECKS_RUN=0

# ── Helper: HTTP GET ─────────────────────────────────────────────────
http_check() {
  local label="$1" url="$2" expected_code="${3:-200}"
  local extra_headers=("${@:4}")
  local tmp_hdr; tmp_hdr="$(mktemp)"
  local tmp_body; tmp_body="$(mktemp)"

  local curl_args=(-sS --max-time "$TIMEOUT" -D "$tmp_hdr" -o "$tmp_body")
  for h in "${extra_headers[@]:-}"; do
    [[ -n "$h" ]] && curl_args+=(-H "$h")
  done

  http_code=$(curl "${curl_args[@]}" -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  # curl -w adds the code at the end of the body; extract from last line
  actual_code=$(tail -c 3 "$tmp_body" 2>/dev/null || echo "000")
  # Actually let's use -w properly
  actual_code=$(curl -sS --max-time "$TIMEOUT" "${extra_headers[@]/#/-H }" \
    -o "$tmp_body" -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  CHECKS_RUN=$((CHECKS_RUN+1))
  rm -f "$tmp_hdr"

  if [[ "$actual_code" == "$expected_code" ]]; then
    pass "$label → HTTP $actual_code"
    echo "$tmp_body"
    return 0
  else
    fail "$label → expected HTTP $expected_code, got HTTP $actual_code"
    rm -f "$tmp_body"
    return 1
  fi
}

# ── 1. Wait for service to be up ─────────────────────────────────────
echo
echo "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"
echo "${BOLD}  GTIXT Post-Deploy Health Check  (port ${PORT})${RESET}"
echo "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"
echo

info "Waiting up to ${MAX_WAIT}s for service on ${BASE} ..."
waited=0
until curl -sS --max-time 3 -o /dev/null -w "%{http_code}" "${BASE}/" 2>/dev/null | grep -qE '^[23]'; do
  sleep 2
  waited=$((waited+2))
  if (( waited >= MAX_WAIT )); then
    fail "Service did not respond within ${MAX_WAIT}s – aborting"
    echo
    echo "${RED}${BOLD}Health check FAILED (service unreachable)${RESET}"
    exit 1
  fi
  echo -n "."
done
echo
pass "Service is up (responded within ${waited}s)"

# ── 2. Root / public page ─────────────────────────────────────────────
echo
echo "${BOLD}── Public pages ─────────────────────────────────────────${RESET}"
CHECKS_RUN=$((CHECKS_RUN+1))
root_code=$(curl -sS --max-time "$TIMEOUT" -o /dev/null -w "%{http_code}" "${BASE}/" 2>/dev/null || echo "000")
if [[ "$root_code" =~ ^[23] ]]; then
  pass "GET /  → HTTP ${root_code}"
else
  fail "GET /  → HTTP ${root_code} (expected 2xx/3xx)"
fi

CHECKS_RUN=$((CHECKS_RUN+1))
firms_code=$(curl -sS --max-time "$TIMEOUT" -o /dev/null -w "%{http_code}" "${BASE}/firms" 2>/dev/null || echo "000")
if [[ "$firms_code" =~ ^[23] ]]; then
  pass "GET /firms → HTTP ${firms_code}"
else
  fail "GET /firms → HTTP ${firms_code}"
fi

# ── 3. ALS supervision endpoint ───────────────────────────────────────
echo
echo "${BOLD}── ALS endpoints ────────────────────────────────────────${RESET}"

ALS_HEADERS=()
if [[ -n "$ALS_TOKEN" ]]; then
  ALS_HEADERS+=("-H" "Authorization: Bearer ${ALS_TOKEN}")
  ALS_HEADERS+=("-H" "x-als-service-scope: autonomous_lab_read")
else
  info "ALS_API_TOKEN not set – skipping ALS checks"
fi

if [[ -n "$ALS_TOKEN" ]]; then
  supervision_body="$(mktemp)"
  CHECKS_RUN=$((CHECKS_RUN+1))
  sup_code=$(curl -sS --max-time "$TIMEOUT" "${ALS_HEADERS[@]}" \
    -o "$supervision_body" -w "%{http_code}" \
    "${BASE}/api/admin/autonomous-lab/supervision" 2>/dev/null || echo "000")

  if [[ "$sup_code" == "200" ]]; then
    pass "GET /api/admin/autonomous-lab/supervision → HTTP 200"
  else
    fail "GET /api/admin/autonomous-lab/supervision → HTTP ${sup_code}"
  fi

  # ── 4. ALS decision-history + uploaded=true check ──────────────────
  history_body="$(mktemp)"
  CHECKS_RUN=$((CHECKS_RUN+1))
  hist_code=$(curl -sS --max-time "$TIMEOUT" "${ALS_HEADERS[@]}" \
    -o "$history_body" -w "%{http_code}" \
    "${BASE}/api/admin/autonomous-lab/decision-history?limit=5&lookbackHours=48" 2>/dev/null || echo "000")

  if [[ "$hist_code" == "200" ]]; then
    pass "GET /api/admin/autonomous-lab/decision-history → HTTP 200"

    # Parse uploaded=true from top snapshot
    CHECKS_RUN=$((CHECKS_RUN+1))
    uploaded=$(node -e "
      try {
        const d = JSON.parse(require('fs').readFileSync('$history_body','utf8'));
        const top = (d?.data?.snapshots || [])[0];
        console.log(top?.metadata?.storage?.uploaded === true ? 'true' : 'false');
      } catch(e) { console.log('parse_error'); }
    " 2>/dev/null || echo "parse_error")

    if [[ "$uploaded" == "true" ]]; then
      pass "Latest snapshot → uploaded=true ✔"
    elif [[ "$uploaded" == "parse_error" ]]; then
      fail "Could not parse decision-history JSON response"
    else
      fail "Latest snapshot → uploaded=${uploaded} (expected true)"
      # Print top snapshot for diagnosis
      node -e "
        try {
          const d = JSON.parse(require('fs').readFileSync('$history_body','utf8'));
          const top = (d?.data?.snapshots || [])[0] || {};
          console.log(JSON.stringify(top?.metadata?.storage, null, 2));
        } catch(e) {}
      " 2>/dev/null || true
    fi
  else
    fail "GET /api/admin/autonomous-lab/decision-history → HTTP ${hist_code}"
  fi

  rm -f "$supervision_body" "$history_body"
fi

# ── 5. MinIO proxy health ──────────────────────────────────────────────
echo
echo "${BOLD}── Storage ──────────────────────────────────────────────${RESET}"
CHECKS_RUN=$((CHECKS_RUN+1))
minio_code=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:9000/minio/health/live" 2>/dev/null || echo "000")
if [[ "$minio_code" =~ ^(200|204)$ ]]; then
  pass "MinIO health (9000) → HTTP ${minio_code}"
else
  fail "MinIO health (9000) → HTTP ${minio_code} (MinIO may be down)"
fi

CHECKS_RUN=$((CHECKS_RUN+1))
minio9003_code=$(curl -sS --max-time 5 -o /dev/null -w "%{http_code}" "http://127.0.0.1:9003/minio/health/live" 2>/dev/null || echo "000")
if [[ "$minio9003_code" =~ ^(200|204)$ ]]; then
  pass "MinIO nginx proxy (9003) → HTTP ${minio9003_code}"
else
  fail "MinIO nginx proxy (9003) → HTTP ${minio9003_code}"
fi

# ── Summary ───────────────────────────────────────────────────────────
echo
echo "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"
if (( FAILED == 0 )); then
  echo "${GREEN}${BOLD}  ✔  All ${CHECKS_RUN} checks passed${RESET}"
  echo "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"
  echo
  exit 0
else
  echo "${RED}${BOLD}  ✘  ${FAILED} / ${CHECKS_RUN} checks FAILED${RESET}"
  echo "${BOLD}${CYAN}═══════════════════════════════════════════════════${RESET}"
  echo
  exit 1
fi
