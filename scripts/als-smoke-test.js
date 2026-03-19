#!/usr/bin/env node

const { spawnSync } = require('child_process')

function getBaseUrl() {
  return (
    process.env.INTERNAL_BASE_URL ||
    process.env.SITE_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_BASE_URL ||
    'http://127.0.0.1:3000'
  )
    .trim()
    .replace(/\/$/, '')
}

const baseUrl = getBaseUrl()
const feedbackUrl = process.env.ALS_FEEDBACK_URL || `${baseUrl}/api/admin/agent-learning/feedback`
const tuningUrl = process.env.ALS_TUNING_URL || `${baseUrl}/api/admin/agent-learning/tuning`
const token = (process.env.ALS_API_TOKEN || process.env.ALS_SERVICE_TOKEN || '').trim()

if (!token) {
  console.error('[ALS-SMOKE] missing ALS_API_TOKEN or ALS_SERVICE_TOKEN in environment')
  process.exit(2)
}

const env = {
  ...process.env,
  ALS_FEEDBACK_URL: feedbackUrl,
  ALS_TUNING_URL: tuningUrl,
  ALS_API_TOKEN: token,
}

const result = spawnSync(
  process.env.GTIXT_PYTHON_PATH || 'python3',
  ['/opt/gpti/gpti-data-bot/scripts/als_smoke_test.py'],
  {
    env,
    stdio: 'inherit',
  },
)

if (result.error) {
  console.error(`[ALS-SMOKE] failed to run python smoke test: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status == null ? 1 : result.status)