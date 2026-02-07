# 🎯 Quick Reference: Where to Get Environment Variables

## 🔴 CRITICAL (Production Monitoring)

### 1. Sentry DSN - Error Tracking
```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7654321
```
**Get it:** https://sentry.io → Create Project → Copy DSN  
**Time:** 5 minutes  
**Cost:** FREE (5k errors/month)

### 2. Slack Webhook - Alerts
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T123/B456/xyz789
```
**Get it:** https://api.slack.com/apps → Create App → Incoming Webhooks  
**Time:** 5 minutes  
**Cost:** FREE

---

## 🟡 RECOMMENDED (Resilience)

### 3. Fallback Pointer URLs
```bash
NEXT_PUBLIC_LATEST_POINTER_FALLBACKS=https://backup1.example.com/latest.json,https://backup2.example.com/latest.json
```
**Get it:** Deploy backup MinIO or use S3/R2  
**Options:**
- **MinIO replica** - Another VPS with synced data (`mc mirror`)
- **AWS S3** - Create bucket + sync with `rclone`
- **Cloudflare R2** - Zero egress fees, global CDN

**Setup:**
```bash
# Option 1: MinIO replica
mc alias set backup https://backup.example.com ACCESS_KEY SECRET_KEY
mc mirror --watch primary/gpti-snapshots backup/gpti-snapshots

# Option 2: AWS S3
aws s3 sync s3://source-bucket s3://backup-bucket --source-region eu-west-1

# Option 3: Cloudflare R2
rclone sync primary:gpti-snapshots r2:gpti-snapshots
```

### 4. Fallback MinIO Roots
```bash
NEXT_PUBLIC_MINIO_FALLBACK_ROOTS=https://backup1.example.com/gpti-snapshots/,https://backup2.example.com/gpti-snapshots/
```
**Get it:** Same as above - public URLs of your backup storage  
**Format:** Comma-separated, must end with `/`

---

## 🟢 ALREADY CONFIGURED

### 5. Primary MinIO (Current)
```bash
NEXT_PUBLIC_LATEST_POINTER_URL=http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json
NEXT_PUBLIC_MINIO_PUBLIC_ROOT=http://51.210.246.61:9000/gpti-snapshots/
```
✅ **Working now** - Your production MinIO at OVH

### 6. Data Sync Settings (Tunable)
```bash
NEXT_PUBLIC_POLL_INTERVAL=300000              # 5 minutes
NEXT_PUBLIC_CACHE_TTL=1800000                 # 30 minutes  
NEXT_PUBLIC_OFFLINE_MAX_AGE_DAYS=7            # 7 days
```
✅ **Default values** - Adjust based on your needs

---

## 📋 Priority Checklist

### This Week (Production-Ready)
- [ ] Create Sentry account → Get DSN → Add to env
- [ ] Create Slack app → Get webhook → Add to env
- [ ] Test alerts: Trigger error, check Slack message

### Next Week (Backup Strategy)
- [ ] Deploy backup MinIO instance (or use S3/R2)
- [ ] Set up sync cron job
- [ ] Add fallback URLs to env
- [ ] Test failover: Stop primary MinIO, verify app still works

### Optional (Global Performance)
- [ ] Add geographic replicas (US, Asia)
- [ ] Configure geo-DNS routing
- [ ] Monitor latency by region

---

## 🧪 Testing Your Setup

### 1. Test Sentry
```bash
# Add to any page temporarily:
throw new Error('Test Sentry integration');

# Check: Sentry dashboard → Issues
```

### 2. Test Slack Webhook
```bash
curl -X POST \
  -H 'Content-type: application/json' \
  --data '{"text":"🧪 Test alert from GPTI"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Check: Slack channel should receive message
```

### 3. Test Fallback System
```bash
# Temporarily add to .env.local:
NEXT_PUBLIC_LATEST_POINTER_FALLBACKS=https://httpstat.us/500,http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json

# First URL fails → Should fallback to second
# Check browser console for "[fetchWithFallback] Trying URL 2/2"
```

---

## 🎓 Learn More

| Service | URL | Purpose |
|---------|-----|---------|
| Sentry | https://sentry.io | Error tracking |
| Slack Apps | https://api.slack.com/apps | Webhook setup |
| MinIO Docs | https://min.io/docs/minio/linux/reference/minio-mc-mirror.html | Data mirroring |
| Cloudflare R2 | https://developers.cloudflare.com/r2/ | Zero-egress storage |
| AWS S3 | https://docs.aws.amazon.com/s3/ | Cloud storage |

---

## 💡 Pro Tips

1. **Sentry + Slack Integration**: Connect Sentry to Slack for unified alerts  
   → Sentry Settings → Integrations → Slack

2. **MinIO Mirroring**: Use `--watch` flag for real-time sync  
   → `mc mirror --watch source dest`

3. **Test Disaster Recovery**: Monthly drill - kill primary, verify fallbacks work  
   → Document recovery time (should be <1 second)

4. **Monitor Costs**: Sentry/Slack free tiers are generous  
   → Sentry: 5k errors/month  
   → Slack: Unlimited messages  
   → Cloudflare R2: 10GB free storage

5. **Environment-Specific Config**:
   ```bash
   # .env.development → http://localhost URLs
   # .env.production → https:// public URLs
   ```

---

## 🆘 Need Help?

**Can't get Sentry DSN?**  
→ See [ENVIRONMENT_VARIABLES_GUIDE.md](./ENVIRONMENT_VARIABLES_GUIDE.md#sentry-error-tracking)

**Can't create Slack webhook?**  
→ See [ENVIRONMENT_VARIABLES_GUIDE.md](./ENVIRONMENT_VARIABLES_GUIDE.md#slack-webhook-for-alerts)

**Want to set up S3/R2 instead of MinIO?**  
→ Ask me! I can generate the setup scripts.

**Questions about fallback strategy?**  
→ See [DEPLOYMENT_VALIDATION.md](../gpti-data-bot/docs/DEPLOYMENT_VALIDATION.md)
