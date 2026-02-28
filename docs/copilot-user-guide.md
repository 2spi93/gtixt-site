# GTiXT Copilot User Guide

## Overview
GTiXT Copilot is an admin assistant that can analyze code, propose patches, generate diffs, and explain impact. It runs in sandbox mode by default so production files are protected.

## Quick Start
1. Open the admin Copilot page: /admin/copilot/
2. Ask a question (for example: "Read file: /opt/gpti/gpti-site/app/admin/copilot/page.tsx")
3. Review the response and any suggested actions

## Core Capabilities
- Read files in allowed roots
- Generate diffs between files
- Explain code changes and impact
- Create action plans
- Trigger admin operations (jobs, crawls, health checks)

## File Explorer
The Copilot page includes a file explorer. Selecting a file will prompt Copilot to read it.

Allowed roots:
- /opt/gpti/gpti-site/app
- /opt/gpti/workers
- /opt/gpti/crawlers
- /opt/gpti/schemas
- /opt/gpti/gpti-site/components
- /opt/gpti/docker

## Sandbox Mode
When sandbox mode is enabled, all writes go to /opt/gpti/sandbox. Production files remain untouched until you manually copy changes.

Environment variables:
- COPILOT_ENV=sandbox|production|development
- SANDBOX_PATH=/opt/gpti/sandbox

## Rate Limits and Quotas
- 50 requests per hour per IP
- Daily token quota (default 50000, configurable)

Environment variable:
- COPILOT_MAX_TOKENS_PER_DAY=50000

## Metrics
Prometheus metrics are exposed at /api/metrics/

## Troubleshooting
- If you get 429 errors, wait for the rate limit or token quota to reset.
- If /api/metrics/ returns 404, rebuild and restart the Next.js server.
