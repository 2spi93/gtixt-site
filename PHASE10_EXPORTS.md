# Phase 10: Prediction V2 + Machine-Readable Exports

**Date:** March 19, 2026  
**Version:** cbe560c  
**Status:** ✅ Complete — 0 TypeScript errors, all exports live

---

## 📋 Overview

Phase 10 delivers three major capabilities:

1. **Prediction V2 Engine** — Deterministic risk forecasting (closure, fraud, stress)
2. **Historical Store Infrastructure** — Real archived snapshots + deterministic replay fallback
3. **Machine-Readable Exports** — CSV/JSON/JSONL/Markdown for external terminals

All three layers maintain the GTIXT core principle: **deterministic, auditable, operationally transparent**.

---

## 🔮 What's New

### 1. Prediction V2 Engine (`lib/prediction-engine.ts`)

Three independent risk scores (0.00 – 1.00):

| Risk Type | Formula | Triggers |
|-----------|---------|----------|
| **Closure Risk** | Early warning + consistency < 40 + payout falling | Structural market exit probability |
| **Fraud Risk** | Consistency < 30 + rule churn + risk model < 25 | Detection of illicit activity |
| **Stress Risk** | Early warning + 2+ pillars weakening | Capital requirement failure |

**Key Properties:**
- All triggers documented for operator review
- Deterministic: computed from current snapshot only, no ML
- Confidence score (0.10–0.90) reflects trigger evidence count
- Primary risk auto-identified when max score ≥ 0.50

**Example Output:**
```typescript
{
  closure_risk: 0.38,
  fraud_risk: 0.12,
  stress_risk: 0.55,
  primary_risk: 'stress',
  overall_confidence: 0.68,
  stress_triggers: [
    { name: 'Early warning: payout-stress', severity: 'critical', ... },
    { name: 'Operational stability', value: '32', threshold: '45', severity: 'watch' }
  ]
}
```

### 2. Historical Store (`lib/historical-store.ts`)

Query real archived snapshots with intelligent fallback:

```typescript
// Priority 1: Real archived snapshots (≥2 records)
const trajectory = await buildHistoricalTrajectory(firm)
// → { type: 'archived', snapshots: [...], methodologyNote: '...' }

// Priority 2: Deterministic replay (if <2 archived snapshots)
// → { type: 'inferred', snapshots: [...], methodologyNote: '...' }
```

**Database Schema:**
- `firm_snapshot_enriched`: Versioned historical record with pillar scores + predictions
- `firm_predictions`: Prediction records with closure/fraud/stress risks + triggers

---

## 🚀 Export Endpoints

### `/api/data/export/firms-snapshot`

**Full firm snapshot with predictions**

**Formats:** `json` (default), `csv`

**Query Parameters:**
- `format` — Output format (json, csv)
- `score_min` — Filter by minimum score (0–100)
- `risk_max` — Filter by maximum risk (0–1)

**Example:**
```bash
# JSON: All firms, default snapshot
curl "https://gtixt.com/api/data/export/firms-snapshot"

# CSV: Firms scoring >60, risk <0.40
curl "https://gtixt.com/api/data/export/firms-snapshot?format=csv&score_min=60&risk_max=0.40"
```

**JSON Response:**
```json
{
  "success": true,
  "snapshot_date": "2026-03-19T14:22:00.000Z",
  "total_firms": 287,
  "systemic_risk": {
    "level": "elevated",
    "stress_ratio_percent": 28.5,
    "deteriorating_count": 34
  },
  "firms": [
    {
      "firm_id": "ftmo",
      "name": "FTMO",
      "score_0_100": 72,
      "payout_reliability": 68,
      "closure_risk": 0.38,
      "fraud_risk": 0.12,
      "stress_risk": 0.55,
      "primary_risk": "stress"
    }
  ]
}
```

**CSV Structure:**
```
Firm ID,Name,Website,Jurisdiction,Score (0-100),Payout Reliability,...,Closure Risk,Fraud Risk,Stress Risk,Primary Risk
ftmo,FTMO,ftmo.com,EU,72.0,68.0,...,0.38,0.12,0.55,stress
```

---

### `/api/data/export/predictions`

**Risk predictions with trigger evidence**

**Formats:** `json` (default), `jsonl` (newline-delimited)

**Query Parameters:**
- `format` — Output format (json, jsonl)
- `risk_type` — Filter (any, closure, fraud, stress)
- `min_risk` — Minimum risk threshold (0–1)

**Example:**
```bash
# JSONL: All predictions
curl "https://gtixt.com/api/data/export/predictions?format=jsonl"

# JSON: High closure risk firms only
curl "https://gtixt.com/api/data/export/predictions?risk_type=closure&min_risk=0.60"
```

**JSONL Response (one prediction per line):**
```
{"firm_id":"ftmo","name":"FTMO","closure_risk":0.38,"fraud_risk":0.12,"stress_risk":0.55,"closure_triggers":[{"name":"Early warning: payout-stress","severity":"critical"},...],"fraud_triggers":[],"stress_triggers":[...]}
{"firm_id":"ic","name":"IC Markets","closure_risk":0.22,...}
```

**JSON Response:**
```json
{
  "success": true,
  "total_predictions": 42,
  "filters": { "risk_type": "closure", "min_risk": 0.60 },
  "predictions": [
    {
      "firm_id": "ftmo",
      "closure_risk": 0.38,
      "closure_triggers": [
        {
          "name": "Payout reliability",
          "value": "68.0",
          "threshold": "55",
          "severity": "watch"
        }
      ]
    }
  ]
}
```

---

### `/api/data/export/insights`

**Market narratives + watchlists**

**Formats:** `json` (default), `markdown`

**Query Parameters:**
- `format` — Output format (json, markdown)

**Example:**
```bash
# JSON: Structured market intelligence
curl "https://gtixt.com/api/data/export/insights"

# Markdown: Report for sharing/documentation
curl "https://gtixt.com/api/data/export/insights?format=markdown" > report.md
```

**JSON Response:**
```json
{
  "success": true,
  "systemic_risk": {
    "level": "elevated",
    "stress_ratio_percent": 28.5
  },
  "market_insights": [
    {
      "title": "Rising Performers",
      "summary": "3 firms with improving scores this quarter",
      "tone": "emerald",
      "kicker": "Emerging leaders"
    }
  ],
  "watchlists": {
    "rising": {
      "count": 3,
      "firms": [{ "name": "FTMO", "score": 72, "link": "..." }]
    },
    "warnings": { "count": 12, "firms": [...] },
    "stressed": { "count": 34, "firms": [...] }
  }
}
```

**Markdown Response:** Formatted report with tables, lists, API reference

---

## 🎨 UI Integration

### PredictionV2Card Component

New component on review pages (FTMO, FundingPips):

```typescript
<PredictionV2Card prediction={prediction} />
```

Features:
- Three segmented risk bars (closure/fraud/stress)
- Trigger breakdown with severity badges
- Overall confidence display
- Methodology note with transparency

---

## 🗄️ Database Schema

### `firm_snapshot_enriched`

Stores enriched snapshots with pillars + predictions:

```sql
CREATE TABLE firm_snapshot_enriched (
  id BIGSERIAL PRIMARY KEY,
  firm_id VARCHAR,
  timestamp TIMESTAMPTZ,
  score_0_100 DECIMAL(5,2),
  payout_reliability DECIMAL(5,2),
  operational_stability DECIMAL(5,2),
  risk_model_integrity DECIMAL(5,2),
  historical_consistency DECIMAL(5,2),
  closure_risk DECIMAL(3,2),
  fraud_risk DECIMAL(3,2),
  stress_risk DECIMAL(3,2),
  signal_type VARCHAR,
  early_warning_type VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(firm_id, timestamp),
  INDEX(firm_id, timestamp DESC),
  INDEX(closure_risk DESC)
);
```

### `firm_predictions`

Prediction records with historical archive:

```sql
CREATE TABLE firm_predictions (
  id BIGSERIAL PRIMARY KEY,
  firm_id VARCHAR,
  timestamp TIMESTAMPTZ,
  closure_risk DECIMAL(3,2),
  fraud_risk DECIMAL(3,2),
  stress_risk DECIMAL(3,2),
  closure_triggers TEXT,
  fraud_triggers TEXT,
  stress_triggers TEXT,
  prediction_horizon VARCHAR DEFAULT 'q1-2026',
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(firm_id, timestamp, prediction_horizon),
  INDEX(firm_id, timestamp DESC)
);
```

---

## 🔄 Workflow

### For Terminal Systems

```
1. Fetch snapshot export
   GET /api/data/export/firms-snapshot?format=json

2. Filter by score + risk thresholds
   Keep only: score > score_min AND max_risk < risk_max

3. Fetch predictions for high-risk subset
   GET /api/data/export/predictions?format=jsonl&min_risk=0.60

4. Alert operators on primary_risk matches
   E.g., closure_risk > 0.70 → URGENT trigger
```

### For Report Generation

```
1. Fetch insights report
   GET /api/data/export/insights?format=markdown

2. Include in weekly/monthly operator briefings
   Auto-generated, always current snapshot
```

### For Data Warehouses

```
1. Fetch all firms snapshot (CSV)
   GET /api/data/export/firms-snapshot?format=csv

2. Load into warehouse (daily cron)
   Store with snapshot_date + version hash

3. Build time-series predictions
   JOIN firm_predictions on (firm_id, timestamp)
```

---

## 📊 Example: External Dashboard Integration

```javascript
// Fetch all predictions with stress risk > 0.55
async function fetchStressedFirms() {
  const res = await fetch(
    'https://gtixt.com/api/data/export/predictions?risk_type=stress&min_risk=0.55'
  )
  const data = await res.json()
  return data.predictions
}

// Render watchlist with triggers
function renderWatchlist(predictions) {
  predictions.forEach(pred => {
    console.log(`${pred.name}: Stress ${Math.round(pred.stress_risk * 100)}%`)
    pred.stress_triggers.forEach(t => {
      console.log(`  - ${t.name}: ${t.value} (threshold: ${t.threshold})`)
    })
  })
}
```

---

## 🔐 Security & Rate Limiting

- All exports are **public** (no auth required)
- Cache-Control: `public, max-age=120` (2 minutes)
- No PII in exports (only firm_id + name + scores)
- Rate limiting: standard VS Code HTTP policy

---

## ✅ Validation

- ✅ 0 TypeScript errors
- ✅ All 3 routes tested (JSON, CSV, JSONL, Markdown)
- ✅ Systemic risk context included in all exports
- ✅ Watchlist slices correct (rising, warnings, stressed)
- ✅ Git commit: `cbe560c`

---

## 📝 Next Steps

**Phase 10b: Real Data Ingestion**
- Hydrate `firm_snapshot_enriched` from archive snapshots
- Schedule prediction updates (nightly batch job)
- Build `firm_snapshots_daily` table for time-series

**Phase 11: Advanced Predictions**
- Multi-period trend analysis (closure trend over 6 months)
- Cross-firm contagion risk (systemic stress amplification)
- Rule change velocity scoring (volatility spike indicator)

---

## 🎯 Success Criteria

| Criterion | Status |
|-----------|--------|
| Prediction V2 live on review pages | ✅ |
| Export endpoints working (all formats) | ✅ |
| TypeScript full validation | ✅ |
| Deterministic + auditable | ✅ |
| No regressions in Phase 8/9 | ✅ |
| Git commit clean | ✅ |
