#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${VALIDATION_BASE_URL:-http://localhost:3000}"
LIMIT="${VALIDATION_LIMIT:-200}"

curl -s -L "${BASE_URL}/api/validation/run?limit=${LIMIT}" | cat
