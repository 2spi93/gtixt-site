#!/usr/bin/env bash
set -u

PASS=0
FAIL=0
WARN=0

ok() {
  PASS=$((PASS + 1))
  echo "[PASS] $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "[FAIL] $1"
}

warn() {
  WARN=$((WARN + 1))
  echo "[WARN] $1"
}

check_http_code() {
  local url="$1"
  local expected="$2"
  local got
  got=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000)
  if [[ "$got" == "$expected" ]]; then
    ok "$url -> $got"
  else
    fail "$url -> expected $expected, got $got"
  fi
}

check_http_code_in() {
  local url="$1"
  local expected_csv="$2"
  local got
  got=$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo 000)
  if [[ ",$expected_csv," == *",$got,"* ]]; then
    ok "$url -> $got (allowed: $expected_csv)"
  else
    fail "$url -> expected one of [$expected_csv], got $got"
  fi
}

have_cmd() {
  command -v "$1" >/dev/null 2>&1
}

as_root() {
  if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
    "$@"
  elif have_cmd sudo && sudo -n true >/dev/null 2>&1; then
    sudo "$@"
  else
    return 127
  fi
}

echo "=== GPTI Security Smoke Check ==="
echo "Host: $(hostname)"
echo "Time: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo

echo "-- Public endpoints --"
check_http_code "https://gtixt.com/" "200"
check_http_code "https://gtixt.com/api/health" "200"
check_http_code "https://gtixt.com/snapshots/latest.json" "200"

echo

echo "-- Restricted endpoints --"
check_http_code_in "https://gtixt.com/admin" "401,403"
check_http_code_in "https://gtixt.com/api/admin/health" "401,403"
check_http_code "https://gtixt.com/api/debug/prisma" "404"

echo

echo "-- Listening ports / bind scope --"
if have_cmd ss; then
  SS_OUT=$(ss -tln 2>/dev/null || true)
  if echo "$SS_OUT" | grep -q '127.0.0.1:3000'; then
    ok "App port 3000 is localhost-only"
  else
    fail "App port 3000 is not localhost-only"
  fi

  if echo "$SS_OUT" | grep -q '127.0.0.1:9002'; then
    ok "Snapshot port 9002 is localhost-only"
  else
    fail "Snapshot port 9002 is not localhost-only"
  fi

  if echo "$SS_OUT" | grep -q '127.0.0.1:5432'; then
    ok "PostgreSQL 5432 is localhost-only"
  else
    warn "PostgreSQL 5432 localhost binding not found"
  fi
else
  warn "ss command missing, skipping port bind checks"
fi

echo

echo "-- Firewall rules (UFW) --"
if as_root ufw status >/dev/null 2>&1; then
  UFW_OUT=$(as_root ufw status 2>/dev/null || true)

  if echo "$UFW_OUT" | grep -q 'Nginx Full'; then
    ok "UFW allows Nginx Full (public web)"
  else
    fail "UFW missing Nginx Full allow"
  fi

  if echo "$UFW_OUT" | grep -q '51820/udp'; then
    ok "UFW allows WireGuard 51820/udp"
  else
    fail "UFW missing WireGuard 51820/udp allow"
  fi

  if echo "$UFW_OUT" | grep -Eq '22[[:space:]]+ALLOW[[:space:]]+10\.0\.0\.0/24'; then
    ok "UFW restricts SSH to VPN subnet"
  else
    warn "UFW SSH rule for VPN subnet not found"
  fi

  if echo "$UFW_OUT" | grep -Eq '22[[:space:]]+ALLOW[[:space:]]+88\.166\.174\.56'; then
    ok "UFW allows SSH from home IP"
  else
    warn "UFW SSH home IP allow not found"
  fi

  if echo "$UFW_OUT" | grep -q 'OpenSSH[[:space:]]\+ALLOW[[:space:]]\+Anywhere'; then
    fail "UFW still exposes generic OpenSSH from Anywhere"
  else
    ok "No generic OpenSSH Anywhere exposure"
  fi
else
  warn "No root/sudo for UFW checks, skipping"
fi

echo
echo "=== Summary ==="
echo "PASS: $PASS"
echo "WARN: $WARN"
echo "FAIL: $FAIL"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi

exit 0
