# Runtime secrets outside repo + dedicated MinIO API endpoint

## Objective

- Keep ALS, MinIO, DB, OpenAI, OSS API key, Slack webhook, Redis password, SMTP pass, and Brevo key out of repository files.
- Use runtime secret files (`*_FILE`) consumed by `getSecretEnv`.
- Use a dedicated MinIO API endpoint for server-side writes (`http://127.0.0.1:9003`) instead of Docker-internal IPs.

## Files changed

- `gpti-site/.env.production.local`
- `gpti-site/.env.example`
- `gpti-site/.env.production.local.example`
- `gpti-site/ops/nginx/minio-api-9003.conf`
- `gpti-site/scripts/setup-minio-als-runtime-secrets.sh`
- `gpti-data-bot/infra/docker-compose.unified.yml`

## Runtime secret files

Expected paths:

- `/run/secrets/gpti-site/als_api_token`
- `/run/secrets/gpti-site/minio_access_key`
- `/run/secrets/gpti-site/minio_secret_key`
- `/run/secrets/gpti-site/database_url`
- `/run/secrets/gpti-site/openai_api_key`
- `/run/secrets/gpti-site/oss_llm_api_key`
- `/run/secrets/gpti-site/slack_webhook_url`
- `/run/secrets/gpti-site/redis_password`
- `/run/secrets/gpti-site/llm_api_key`
- `/run/secrets/gpti-site/smtp_pass`
- `/run/secrets/gpti-site/brevo_api_key`

Create/bootstrap them:

```bash
sudo /opt/gpti/gpti-site/scripts/setup-minio-als-runtime-secrets.sh
```

The script assigns the secret directory and files to the application runtime user.
For this host, `gpti-site.service` runs as `deploy`, so `/run/secrets/gpti-site/*`
must remain readable by `deploy` after any manual secret rotation.

Then set actual values:

```bash
echo -n 'your-als-token' | sudo tee /run/secrets/gpti-site/als_api_token >/dev/null
echo -n 'your-minio-access-key' | sudo tee /run/secrets/gpti-site/minio_access_key >/dev/null
echo -n 'your-minio-secret-key' | sudo tee /run/secrets/gpti-site/minio_secret_key >/dev/null
echo -n 'postgresql://user:pass@localhost:5432/gpti' | sudo tee /run/secrets/gpti-site/database_url >/dev/null
echo -n 'sk-proj-xxxx' | sudo tee /run/secrets/gpti-site/openai_api_key >/dev/null
echo -n 'oss-api-key-if-used' | sudo tee /run/secrets/gpti-site/oss_llm_api_key >/dev/null
echo -n 'https://hooks.slack.com/services/...' | sudo tee /run/secrets/gpti-site/slack_webhook_url >/dev/null
echo -n 'redis-password' | sudo tee /run/secrets/gpti-site/redis_password >/dev/null
echo -n 'legacy-llm-key-if-used' | sudo tee /run/secrets/gpti-site/llm_api_key >/dev/null
echo -n 'smtp-password' | sudo tee /run/secrets/gpti-site/smtp_pass >/dev/null
echo -n 'xkeysib-...' | sudo tee /run/secrets/gpti-site/brevo_api_key >/dev/null
sudo chown -R deploy:deploy /run/secrets/gpti-site
sudo chmod 700 /run/secrets/gpti-site
sudo chmod 600 /run/secrets/gpti-site/*
```

## Dedicated MinIO API endpoint

Nginx template:

- `/opt/gpti/gpti-site/ops/nginx/minio-api-9003.conf`

Behavior:

- `127.0.0.1:9003` -> reverse proxy to `127.0.0.1:9000` (MinIO S3 API)

To make upstream stable on host, unified compose now publishes MinIO locally:

- `127.0.0.1:9000:9000` (S3 API)
- `127.0.0.1:9001:9001` (console)

## Deploy order

1. Redeploy infra compose so MinIO local ports are published.
2. Install/reload nginx config for `127.0.0.1:9003`.
3. Populate secret files in `/run/secrets/gpti-site`.
4. Start/restart `gpti-site` with the canonical launcher:

```bash
cd /opt/gpti/gpti-site
npm run start:prod
```

Or with PM2:

```bash
pm2 start /opt/gpti/gpti-site/ecosystem.config.js --only gpti-site --env production
```

## Validation

Quick probes:

```bash
curl -sS -I http://127.0.0.1:9003/minio/health/live
curl -sS -I http://127.0.0.1:3005/api/admin/autonomous-lab/supervision \
  -H 'Authorization: Bearer <ALS_TOKEN>' \
  -H 'x-als-service-token: <ALS_TOKEN>' \
  -H 'x-als-service-scope: autonomous_lab_read'
```

Expected:

- MinIO API health responds through `:9003`.
- Autonomous Lab routes keep returning `200` with scoped auth.
- New supervision snapshots show `metadata.storage.uploaded=true`.
