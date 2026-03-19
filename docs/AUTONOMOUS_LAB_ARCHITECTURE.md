# GTIXT Autonomous Lab - Target Architecture

## Objective
GTIXT keeps production deterministic while enabling autonomous optimization in controlled layers.

## Mandatory Separation
1. Production Layer: stable scoring and publication paths.
2. Shadow Layer: baseline scorer and candidate scorer run in parallel.
3. Lab Layer: multi-agent experimentation and evaluation only.
4. Operator Layer: bounded execution actions, no direct production mutation.

## Critical Bricks
### 1) Experiment Registry (required)
Registry stores every hypothesis, changeset, metrics, status, and reviewer recommendation.

Core record shape:

```json
{
  "id": "exp_001",
  "module": "scoring",
  "hypothesis": "improve risk separation",
  "changes": ["risk_weight_v2"],
  "metrics": {
    "coverageDelta": 12,
    "stabilityDelta": 4,
    "anomaliesDelta": -8
  },
  "status": "tested"
}
```

### 2) Shadow Mode (critical)
Scoring candidate never replaces production directly.

- Baseline scorer: current production logic.
- Candidate scorer: experimental logic.
- Compare metrics before any promotion.

Fine metrics evaluated in shadow:
- riskSeparationDelta (inter-bucket separation quality)
- snapshotDriftDelta (stability versus previous snapshot)
- bucketChurnDelta (bucket transition churn control)

Promotion guard: no auto-deploy for scoring changes.

### 3) Multi-agent pipeline with human promotion
Architect -> Code Agent -> Runner -> Analyst -> Reviewer -> Human Promotion.

Promotion queue is explicit and auditable:
- request promotion (pending)
- approve/reject by admin
- decision logged in admin audit trail

## Roles
- Autoresearch role: hypothesis generator only.
- OpenClaw role: bounded operator only (safe jobs, cache warmup, health checks).
- Reviewer role: enforce governance and audit before promotion.

## Initial Implementation Scope
- Experiment registry table and APIs.
- Shadow scoring API + metrics comparison.
- Minimal orchestrator API and decision output.
- WebGL optimizer API using telemetry-based hints.
- Safe operator API with allowlist actions.
- Admin UI for lab operations.

## Non-goals in MVP
- Direct production patching.
- Automatic deploy or scoring promotion.
- Unbounded command execution.

## Promotion Policy
Candidate can be promoted for review only if:
- coverageDelta >= 0
- stabilityDelta >= 0
- anomaliesDelta >= 0
- no critical WebGL telemetry spikes

Final promotion remains human-approved.

## Canary Routing (Now Wired)

Canary states are no longer logical-only metadata.

- Active canary states (`canary_10/25/50/100`) are resolved at runtime per module.
- Routing decision is sticky per user/session via a dedicated canary cookie key.
- Decision output is deterministic (`bucket < trafficPct`) and yields `baseline` or `candidate`.
- Current production wiring uses this split in feature flag serving for `webgl` (`/api/feature-flags`).

Operational behavior:
- if no active canary exists for the module, traffic stays on baseline.
- if a canary is active, only the configured percentage receives candidate behavior.
- rollback immediately collapses candidate traffic to 0%.

## Advanced Runtime Control (Level 5+)

### 1) System load score (infra-aware pacing)
Continuous scheduler computes an infra load score in [0..1] based on:

```text
systemLoad =
  cpuUsageNorm * 0.4 +
  apiLatencyNorm * 0.3 +
  queueDepthNorm * 0.3
```

Behavior:
- if `systemLoad > 0.8`: aggressive slowdown.
- otherwise: adaptive pacing by cycle duration and work processed.

### 2) Global threat level (market-reactive)
Radar signal is transformed into a global threat score in [0..1]:

```text
threatLevel =
  dangerFirmsNorm * 0.5 +
  newAlertsNorm * 0.3 +
  suspiciousSignalsNorm * 0.2
```

Behavior:
- if `threatLevel > 0.7`: pacing override into fast mode.

### 3) Dynamic priority threshold
Priority trigger is auto-calibrated each cycle:

```text
dynamicThreshold =
  baseThreshold * (1 + systemLoad) * (1 - recentSuccessRate)
```

This prevents fixed-threshold bias and adapts to both infrastructure pressure and recent quality.

### 4) Burst mode (reactive + aggressive)
When urgent pressure is confirmed, scheduler can run multiple cycles back-to-back.

Burst trigger:
- high priority pressure
- high radar danger
- high global threat level

Effect:
- execute `N` immediate cycles without normal inter-cycle delay.

### 5) Quality stop (anti-noise guard)
Continuous mode includes quality pause logic:
- compute recent approval rate from decided experiments
- if `approvalRate < quality floor` for enough samples:
  - pause scheduler window (or hard-exit if configured)

This prevents drift into low-quality experimentation noise.

### 6) Cycle classification
Each loop is classified as:
- `exploration`: broaden search when pressure is low.
- `exploitation`: accelerate on high pressure/threat.
- `recovery`: stabilize when success quality degrades.

Classification drives pacing and operational posture.

### 7) Decision memory (self-governing foundation)
A persistent decision memory tracks repeated failures by `(module, hypothesis)`.

Rule:
- if the same hypothesis is rejected 3+ times,
- apply a permanent ranking penalty in priority engine.

Effect:
- avoids infinite replay loops,
- improves long-term scheduling efficiency,
- creates a governance-aligned memory of failed directions.

## Supervision Endpoint (Level 6)

For direct admin piloting, GTIXT exposes:

- `GET /api/admin/autonomous-lab/supervision`

Real-time output includes:
- `systemLoad`
- `threatLevel`
- `cycleType` (`exploration` | `exploitation` | `recovery`)
- `dynamicThreshold`
- `qualityStop` state

Additional telemetry is returned for explainability:
- load components (`cpuUsage`, `apiLatency`, `queueDepth`)
- `priorityPressure` and top priority score
- radar summary and active priority overrides
- runtime control state and recent runtime-control audit events

Optional query parameters:
- `baseThreshold`
- `recoverySuccessThreshold`
- `qualityStopMinApprovalRate`
- `qualityStopMinSamples`
- `latencySaturationMs`
- `queueDepthSaturation`

## Runtime Control Governance

Scheduler runtime mode (`auto`, `fast`, `safe`) is operator-controlled but still audit-bound.

- Every mode change writes an explicit `adminAuditTrail` entry.
- Audit entry stores `fromMode`, `toMode`, actor identity, and before/after state.
- Admin supervision surfaces the latest runtime-control audit events directly in the lab UI.
- UI locks mode buttons while the `PATCH` is in flight to avoid double-write races.

## Deployment Hygiene

To avoid stale Next.js chunk mismatches such as `/_next/static/chunks/... 400` after a new build:

- restart the active production service immediately after build;
- target the real process name (`gpti-site` in PM2) instead of assuming a generic `next` process;
- if the named process does not exist, start it explicitly from `ecosystem.config.js`.

This prevents serving a new HTML shell against old chunk assets or the inverse.
