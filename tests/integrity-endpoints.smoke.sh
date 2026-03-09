#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3002}"

echo "[1/2] Industry report"
INDUSTRY_JSON="$(curl -fsS "$BASE_URL/api/integrity/industry-report")"
echo "$INDUSTRY_JSON" | jq '.total_firms, .duration_ms, .execution_mode' >/dev/null

echo "[2/2] Firm report (id=253)"
FIRM_JSON="$(curl -fsS "$BASE_URL/api/integrity/firm/253")"
echo "$FIRM_JSON" | jq '.firm_id, .overall_score, .duration_ms, .execution_mode' >/dev/null

echo "✅ Integrity endpoints smoke test passed"
