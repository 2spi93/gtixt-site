# Nightly Batch Predictions Scheduler

This scheduler runs both jobs every night at 02:00 UTC:

1. `POST /api/admin/batch/snapshot-hydration`
2. `POST /api/admin/batch/predictions?horizon=...`

## Files

- `scripts/run-nightly-batch-jobs.sh`
- `scripts/systemd/gtixt-nightly-batch.service`
- `scripts/systemd/gtixt-nightly-batch.timer`
- `scripts/install-nightly-batch-timer.sh`

## Required Environment

Set one of these tokens in `.env.production.local`:

- `BATCH_ADMIN_TOKEN=...`
- or `ADMIN_BATCH_TOKEN=...`

Optional:

- `SITE_URL=http://127.0.0.1:3000` (default uses localhost)
- `BATCH_PREDICTION_HORIZON=q2-2026`
- `BATCH_JOB_TIMEOUT_SECONDS=120`

## Install Timer

```bash
sudo /opt/gpti/gpti-site/scripts/install-nightly-batch-timer.sh
```

## Manual Run

```bash
cd /opt/gpti/gpti-site
set -a && source .env.production.local && set +a
./scripts/run-nightly-batch-jobs.sh
```

## Validate

```bash
systemctl --no-pager --full status gtixt-nightly-batch.timer
systemctl list-timers --all --no-pager | grep gtixt-nightly-batch
journalctl -u gtixt-nightly-batch.service -n 100 --no-pager
```
