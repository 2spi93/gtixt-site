# GTIXT Exports Integration Guide (v1.0)

Status: Public Integration Guide
Owner: GTIXT Intelligence Engine
Audience: External dashboards, quant bots, risk desks, data platforms

## Positioning

GTIXT provides machine-readable exports for risk intelligence distribution across external systems.

## Available export endpoints

### 1) Firms Snapshot Export

Endpoint:
- GET /api/data/export/firms-snapshot

Formats:
- json
- csv

Purpose:
- Current benchmark state for firm universe
- Scores, pillars, and core descriptors for ranking and screening workflows

### 2) Predictions Export

Endpoint:
- GET /api/data/export/predictions

Formats:
- json
- jsonl

Purpose:
- Closure, fraud, stress probabilities
- Trigger payloads
- Horizon-aligned prediction feeds

### 3) Insights Export

Endpoint:
- GET /api/data/export/insights

Formats:
- json
- markdown

Purpose:
- Human-readable and machine-readable market commentary
- Risk and systemic context for weekly distribution

## Integration patterns

### Pattern A: Dashboard ingestion

- Pull firms snapshot every N minutes
- Pull predictions on schedule (for example every 15 or 30 minutes)
- Render interpretation bands using GTIXT Risk Interpretation Standard

### Pattern B: Bot/automation ingestion

- Ingest jsonl predictions stream
- Apply threshold logic:
  - Elevated: create alert task
  - High: freeze action route
  - Critical: trigger escalation webhook

### Pattern C: Data warehouse ingestion

- Land raw export files into staging tables
- Keep immutable timestamped batches
- Build derived marts for:
  - cross-firm risk ranking
  - trend analysis
  - contagion stress maps

## Minimum schema contract (recommended)

Use these required fields in downstream systems:
- firm_id
- timestamp
- closure_risk
- fraud_risk
- stress_risk
- confidence
- prediction_horizon
- triggers (array or serialized payload)

## Reliability and validation checks

Before accepting a batch, validate:
- payload parse success
- required fields present
- risk range in [0.00, 1.00]
- timestamp format and recency
- non-empty universe for expected window

## Interpretation binding rule

Never display numeric probability alone.

Always bind each probability to:
- probability band
- human interpretation sentence
- recommended action

Reference:
- GTIXT_RISK_INTERPRETATION_STANDARD.md

## Example operational thresholds

- closure_risk >= 0.60: Elevated event
- closure_risk >= 0.75: High event
- closure_risk >= 0.85: Critical event

- fraud_risk >= 0.70: Compliance review queue
- stress_risk >= 0.70: Systemic monitoring queue

## Security and operational controls

Recommended controls:
- API token rotation policy
- rate limit handling and retry with backoff
- immutable export archive
- audit trail of consumed batches

## Implementation checklist

- Endpoint connectivity tested
- Parsing logic tested for all formats
- Validation rules enforced
- Threshold actions wired
- Alerting and escalation wired
- Monitoring dashboard live

## Change management

When GTIXT export fields evolve:
- publish schema diff
- keep compatibility window
- version downstream parser logic

## Public statement template

"This system consumes GTIXT machine-readable exports and applies GTIXT interpretation standards for institutional risk monitoring."
