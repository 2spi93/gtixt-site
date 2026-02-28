// /opt/gpti/gpti-site/lib/metrics.ts

import { Counter, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();

export const copilotRequestsTotal = new Counter({
  name: 'gtixt_copilot_requests_total',
  help: 'Total copilot requests',
  labelNames: ['action', 'status'],
  registers: [metricsRegistry],
});

export const copilotRequestDuration = new Histogram({
  name: 'gtixt_copilot_request_duration_seconds',
  help: 'Copilot request duration in seconds',
  labelNames: ['action'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const copilotTokensUsed = new Counter({
  name: 'gtixt_copilot_tokens_used_total',
  help: 'Total tokens used by copilot',
  labelNames: ['model'],
  registers: [metricsRegistry],
});
