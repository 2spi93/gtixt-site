#!/usr/bin/env bash
set -euo pipefail

SYSTEMD_DIR="/etc/systemd/system"
SERVICE_SRC="/opt/gpti/gpti-site/scripts/systemd/gtixt-nightly-batch.service"
TIMER_SRC="/opt/gpti/gpti-site/scripts/systemd/gtixt-nightly-batch.timer"
SERVICE_DST="${SYSTEMD_DIR}/gtixt-nightly-batch.service"
TIMER_DST="${SYSTEMD_DIR}/gtixt-nightly-batch.timer"

if [[ ! -f "${SERVICE_SRC}" || ! -f "${TIMER_SRC}" ]]; then
  echo "[install-nightly-batch-timer] Missing unit files under scripts/systemd." >&2
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "[install-nightly-batch-timer] Run with sudo/root." >&2
  exit 1
fi

install -m 0644 "${SERVICE_SRC}" "${SERVICE_DST}"
install -m 0644 "${TIMER_SRC}" "${TIMER_DST}"
mkdir -p /var/log/gtixt
chown deploy:deploy /var/log/gtixt

echo "[install-nightly-batch-timer] Reloading systemd daemon..."
systemctl daemon-reload

echo "[install-nightly-batch-timer] Enabling timer..."
systemctl enable --now gtixt-nightly-batch.timer

echo "[install-nightly-batch-timer] Timer status:"
systemctl --no-pager --full status gtixt-nightly-batch.timer || true

echo "[install-nightly-batch-timer] Next runs:"
systemctl list-timers --all --no-pager | grep gtixt-nightly-batch || true
