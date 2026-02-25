# 🔐 Configuration Guide - Environment Variables

This guide explains where to obtain credentials and configure all environment variables for the GPTI platform.

---

## 📊 Data Sources & Fallbacks

### Primary MinIO Instance
```bash
NEXT_PUBLIC_LATEST_POINTER_URL=http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_MINIO_PUBLIC_ROOT=http://51.210.246.61:9000/gpti-snapshots/
```

**Where to get:** These are your **current production MinIO URLs**. Already configured and working at `51.210.246.61:9000`.

### Fallback URLs (Optional but Recommended)

```bash
NEXT_PUBLIC_LATEST_POINTER_FALLBACKS=https://backup1.example.com/latest.json,https://backup2.example.com/latest.json
NEXT_PUBLIC_MINIO_FALLBACK_ROOTS=https://backup1.example.com/gpti-snapshots/,https://backup2.example.com/gpti-snapshots/
```

**Where to get:**
1. **Option 1: Additional MinIO instances** - Set up replica MinIO servers in different data centers
   - Deploy MinIO on another VPS (e.g., OVH, Hetzner, AWS)
   - Sync data with `mc mirror` command
   - Use the public URLs of these instances

2. **Option 2: CDN mirrors** - Use Cloudflare R2, AWS S3, or similar
   - Create bucket with same structure
   - Sync with `rclone` or `aws s3 sync`
   - Use public HTTPS URLs

3. **Option 3: Geographic mirrors** - For global redundancy
   - Deploy MinIO in different regions (EU, US, Asia)
   - Use geo-DNS to route to nearest instance
   - Fallbacks ensure continuity if one region fails

**Format:** Comma-separated list of full URLs (no spaces)

**Example setup:**
```bash
# Primary: Your current VPS (France)
NEXT_PUBLIC_MINIO_PUBLIC_ROOT=http://51.210.246.61:9000/gpti-snapshots/

# Backup 1: AWS S3 bucket (US)
# Backup 2: Cloudflare R2 (Global CDN)
NEXT_PUBLIC_MINIO_FALLBACK_ROOTS=https://gpti-snapshots.s3.amazonaws.com/,https://pub-abc123.r2.dev/gpti-snapshots/
```

**To set up fallbacks:**
```bash
# 1. Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# 2. Configure aliases
mc alias set primary http://51.210.246.61:9000 minioadmin minioadmin
mc alias set backup https://backup1.example.com YOUR_KEY YOUR_SECRET

# 3. Mirror data (run daily via cron)
mc mirror --watch primary/gpti-snapshots backup/gpti-snapshots
```

---

## ⏱️ Data Sync Configuration

```bash
NEXT_PUBLIC_POLL_INTERVAL=300000        # 5 minutes (in milliseconds)
NEXT_PUBLIC_CACHE_TTL=1800000           # 30 minutes
NEXT_PUBLIC_OFFLINE_MAX_AGE_DAYS=7      # 7 days
```

**Where to get:** These are **tuning parameters** you set based on your needs:

- `POLL_INTERVAL`: How often to check for new data
  - 300000ms (5 min) = balanced
  - 60000ms (1 min) = real-time, higher load
  - 600000ms (10 min) = reduced load

- `CACHE_TTL`: How long to cache data in browser
  - 1800000ms (30 min) = good for institutional data
  - 3600000ms (1 hour) = less server load
  - 900000ms (15 min) = fresher data

- `OFFLINE_MAX_AGE_DAYS`: Max age of cached data when offline
  - 7 days = default
  - 1 day = always fresh
  - 30 days = extended offline capability

---

## 🔔 Monitoring & Alerting

### Sentry Error Tracking

```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7654321
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

**Where to get:**
1. Go to **https://sentry.io**
2. Sign up (free tier: 5,000 errors/month)
3. Create new project → Choose "Next.js"
4. Copy the DSN from the setup wizard
5. Paste into `.env.local` or `.env.production`

**Screenshots of Sentry setup:**
```
1. Dashboard → Create Project
2. Select Platform: Next.js
3. Copy DSN: https://[key]@[org].ingest.sentry.io/[project]
4. Configure alerts: Settings → Alerts → New Alert Rule
```

**Why you need this:**
- Track all JavaScript errors in production
- Get stack traces for debugging
- Monitor API performance
- Receive email/Slack notifications on critical errors

---

### Slack Webhook for Alerts

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Where to get:**
1. Go to **https://api.slack.com/apps**
2. Click "Create New App" → "From scratch"
3. Name: "GPTI Monitoring"
4. Choose your workspace
5. Features → Incoming Webhooks → Activate
6. Click "Add New Webhook to Workspace"
7. Select channel (e.g., #alerts, #monitoring)
8. Copy the webhook URL
9. Paste into `.env.local` (server-only variable)

**Step-by-step:**
```
1. https://api.slack.com/apps → "Create New App"
2. App Name: GPTI Monitoring Bot
3. Workspace: [Your workspace]
4. Settings → Incoming Webhooks → ON
5. "Add New Webhook to Workspace"
6. Select channel: #gpti-alerts
7. Copy: https://hooks.slack.com/services/T123/B456/xyz789
8. Test: curl -X POST -H 'Content-type: application/json' --data '{"text":"Test alert"}' YOUR_WEBHOOK_URL
```

**What you'll get alerted on:**
- ❌ MinIO connection failures
- ⚠️ Stale data (>48 hours old)
- 🚨 API rate limit exhaustion
- 🔄 Data sync failures after 3 retries

**Alert examples:**
```json
{
  "text": "🚨 MinIO Connection Failure",
  "blocks": [
    {
      "type": "header",
      "text": "🚨 MinIO Connection Failure"
    },
    {
      "type": "section",
      "text": "Failed to connect to MinIO bucket `gpti-snapshots`.",
      "fields": [
        {"type": "mrkdwn", "text": "*Bucket:* gpti-snapshots"},
        {"type": "mrkdwn", "text": "*Error:* ECONNREFUSED"},
        {"type": "mrkdwn", "text": "*Timestamp:* 2026-02-03T14:32:15Z"}
      ]
    }
  ]
}
```

---

## 🏦 FCA API Credentials (for gpti-data-bot)

```bash
FCA_API_KEY=your_fca_api_key_here
FCA_API_SECRET=your_fca_api_secret_here
```

**Where to get:**
1. Go to **https://register.fca.org.uk/Developer/s/**
2. Create account (requires UK business registration OR research use case)
3. Create application:
   - Application Name: "GPTI Index Research"
   - Purpose: "Regulatory data aggregation for transparency index"
4. Generate credentials
5. Copy API Key and API Secret
6. Add to `/opt/gpti/gpti-data-bot/.env`

**Full documentation:** See [FCA_CREDENTIALS_SETUP.md](../gpti-data-bot/docs/FCA_CREDENTIALS_SETUP.md)

---

## 📝 Deployment Checklist

### Development (`.env.local`)
```bash
# Required
NEXT_PUBLIC_LATEST_POINTER_URL=http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_MINIO_PUBLIC_ROOT=http://51.210.246.61:9000/gpti-snapshots/

# Optional but recommended
NEXT_PUBLIC_POLL_INTERVAL=300000
NEXT_PUBLIC_CACHE_TTL=1800000
NEXT_PUBLIC_OFFLINE_MAX_AGE_DAYS=7
```

### Production (PM2 / npm start)
```bash
# Required
NEXT_PUBLIC_LATEST_POINTER_URL=http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_MINIO_PUBLIC_ROOT=http://51.210.246.61:9000/gpti-snapshots/

# Fallbacks (HIGHLY recommended)
NEXT_PUBLIC_LATEST_POINTER_FALLBACKS=https://backup1.example.com/latest.json,https://backup2.example.com/latest.json
NEXT_PUBLIC_MINIO_FALLBACK_ROOTS=https://backup1.example.com/gpti-snapshots/,https://backup2.example.com/gpti-snapshots/

# Data sync tuning
NEXT_PUBLIC_POLL_INTERVAL=300000
NEXT_PUBLIC_CACHE_TTL=1800000
NEXT_PUBLIC_OFFLINE_MAX_AGE_DAYS=7

# Monitoring (CRITICAL for production)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 🚀 Quick Start

### 1. Copy example to local
```bash
cd /opt/gpti/gpti-site
cp .env.example .env.local
```

### 2. Edit `.env.local`
```bash
nano .env.local  # or vim, code, etc.
```

### 3. Add your credentials
- **Required:** MinIO URLs (already set)
- **Optional:** Fallback URLs (if you have backups)
- **Recommended:** Sentry DSN + Slack webhook

### 4. Test locally
```bash
npm run dev
# Visit http://localhost:3000/rankings
# Check console for "[DataSync]" and "[Alerting]" logs
```

### 5. Deploy to production (PM2 / npm start)
```bash
# 1) Add env vars in .env or .env.production.local
# 2) Build: npm run build
# 3) Restart: pm2 restart next  # or: npm run start
```

---

## 🔍 Troubleshooting

### "Failed to fetch latest.json"
- ✅ Check MinIO is running: `curl http://51.210.246.61:9000/minio/health/live`
- ✅ Check firewall allows port 9000
- ✅ Verify URL in `.env.local`

### "No Slack alerts received"
- ✅ Test webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' $SLACK_WEBHOOK_URL`
- ✅ Verify webhook URL starts with `https://hooks.slack.com/`
- ✅ Check it's in `.env.local` (server-only, NOT `.env.production` for browser)

### "Sentry not capturing errors"
- ✅ Verify DSN in browser console: `window.__SENTRY__`
- ✅ Check environment: `NEXT_PUBLIC_SENTRY_ENVIRONMENT=production`
- ✅ Trigger test error: Add `throw new Error('Test')` in a page

---

## 📚 Related Documentation

- [DEPLOYMENT_VALIDATION.md](../gpti-data-bot/docs/DEPLOYMENT_VALIDATION.md) - Full deployment guide
- [FCA_CREDENTIALS_SETUP.md](../gpti-data-bot/docs/FCA_CREDENTIALS_SETUP.md) - FCA API registration
- [MINIO_OBJECT_LOCK_SETUP.md](../gpti-data-bot/docs/MINIO_OBJECT_LOCK_SETUP.md) - MinIO configuration
- [RUNBOOK.md](../gpti-data-bot/docs/RUNBOOK.md) - Operations manual

---

## ✅ Summary

**You already have:**
- ✅ MinIO primary URLs (51.210.246.61:9000)
- ✅ Data sync configuration (polling, caching)
- ✅ Monitoring infrastructure (code ready)

**You need to obtain:**
- 🔑 **Sentry DSN** → https://sentry.io (5 min setup)
- 🔑 **Slack webhook** → https://api.slack.com/apps (5 min setup)
- 🔑 **Fallback URLs** → Deploy backup MinIO or S3 (optional, 30 min setup)

**Priority order:**
1. **Now:** Sentry + Slack (production monitoring)
2. **This week:** Fallback MinIO instances (resilience)
3. **Optional:** Geographic mirrors (global performance)
