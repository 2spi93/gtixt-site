# GTIXT Site - Local Development Data Generator

**Purpose**: Generate realistic test data for frontend development without depending on production data pipeline.

**Location**: `/opt/gpti/gpti-site/scripts/generate-test-snapshot.js`

---

## Overview

This script generates a complete test snapshot with 106 firms containing realistic varied data for all GTIXT metrics. It's designed for **local development and testing only** and should never be used in production.

### ⚠️ Important Distinctions

| Component | Purpose | Data Source | Environment |
|---|---|---|---|
| **This Generator** | Frontend testing | Synthetic/random | Development only |
| **gpti-data-bot** | Production scoring | Real web crawling | Production |
| **MinIO Snapshots** | Live data | Bot pipeline output | Production |

---

## What It Does

1. **Fetches firm list** from production MinIO snapshot (names and IDs only)
2. **Generates synthetic data** for each firm:
   - Varied scores (15-87 range, realistic distribution)
   - Jurisdiction tiers (A/B/C/D/UNKNOWN)
   - Confidence levels (high/medium/low)
   - NA rates (10-40%)
   - Pillar scores (5 pillars, correlated with total score)
   - Detailed metrics (payout frequency, drawdown rules, etc.)
   - SHA256 hashes for integrity
   - Historical snapshots (2 data points)
   - Percentile rankings

3. **Outputs**: `/opt/gpti/gpti-site/data/test-snapshot.json` (complete snapshot)

---

## Usage

```bash
cd /opt/gpti/gpti-site
node scripts/generate-test-snapshot.js
```

**Output Example**:
```
✓ Generated test snapshot with 106 firms
✓ Saved to: /opt/gpti/gpti-site/data/test-snapshot.json

📊 Statistics:
  - Avg Score: 49.3
  - Top Score: 87
  - Median Score: 51
  - Confidence: {"high":20,"medium":36,"low":50}
  - Jurisdictions: {"tier_A":52,"tier_B":22,"tier_C":6,"tier_D":12,"unknown":14}
```

---

## Data Fields Generated

### Core Metrics
- `firm_id`: Unique identifier (e.g., "ftmocom")
- `name`: Firm name (e.g., "FTMO")
- `website_root`: Official URL
- `model_type`: CFD_FX, FUTURES, EQUITIES
- `status`: approved, watchlist, candidate, under_review
- `score_0_100`: Total score (15-87 range, varied)

### Pillar Scores (0-1 scale)
- `A_transparency`: Transparency & Rules Clarity
- `B_payout_reliability`: Payout Reliability
- `C_risk_model`: Risk Model Integrity
- `D_legal_compliance`: Legal Compliance
- `E_reputation_support`: Operational Stability

### Jurisdiction & Quality
- `jurisdiction`: ISO code (US, UK, EU, AU, SG, AE, CY, BZ, SC, UNKNOWN)
- `jurisdiction_tier`: A (best), B, C, D (worst), UNKNOWN
- `confidence`: high, medium, low
- `na_rate`: Missing data rate (10-40%)
- `data_completeness`: Calculated from na_rate (0.3-1.0)
- `historical_consistency`: Score stability (0.5-1.0)

### Detailed Metrics
- `payout_frequency`: weekly, bi-weekly, monthly, on-demand, quarterly
- `max_drawdown_rule`: Various rules (e.g., "10% daily", "trailing")
- `rule_changes_frequency`: low, medium, high, stable, frequent
- `oversight_gate_verdict`: pass, conditional_pass, under_review, fail
- `na_policy_applied`: neutral_50, conservative_40, optimistic_60, strict

### Integrity & Verification
- `sha256`: 16-char hash for snapshot integrity
- `verification_hash`: Secondary hash for verification
- `last_updated`: ISO timestamp

### Historical Data
- `snapshot_history`: Array of 2 snapshots (previous month + current)
  - Each with: date, score, confidence, note

### Comparative Positioning
- `percentile_overall`: Overall ranking percentile (0-100)
- `percentile_model`: Ranking within model type
- `percentile_jurisdiction`: Ranking within jurisdiction

### Additional Context
- `founded_year`: 2015-2023 range
- `website_status`: "active"
- `regulatory_status`: "regulated" or "unregulated"
- `executive_summary`: Descriptive text

---

## Algorithm Details

### Score Generation
```javascript
// Varied scores based on multiple factors
const hash = seedString.charCodeAt();
const baseScore = 30 + (hash % 40);           // Base: 30-70
const indexFactor = Math.sin(index * 2.1) * 15; // Wave: ±15
const randomFactor = (hash % 20) - 10;         // Random: ±10
return Math.round(Math.max(15, Math.min(95, total)));
```

**Result**: Realistic distribution with variety, not all firms = 42

### Pillar Score Correlation
```javascript
// Pillar scores correlate with total score
const scoreFactor = score / 100;
pillarScore = Math.max(0.1, Math.min(0.95, 
  scoreFactor * 0.7 + randomVariation
));
```

**Result**: Higher overall scores → higher pillar scores (logical)

### Jurisdiction Assignment
```javascript
// Deterministic based on firm ID hash
const jurisdiction = JURISDICTIONS[hash % JURISDICTIONS.length];
```

**Result**: Consistent assignment, realistic distribution

---

## How Frontend Uses This Data

### API Layer (`pages/api/`)

**`/api/firms.ts`**:
```javascript
// Try local test snapshot first
const testSnapshot = loadTestSnapshot();
if (testSnapshot && Array.isArray(testSnapshot.records)) {
  firms = testSnapshot.records; // Use generated data
} else {
  // Fall back to remote MinIO snapshot
}
```

**`/api/firm.ts`**:
```javascript
// Same pattern - local first, remote fallback
const testSnapshot = loadTestSnapshot();
```

### Pages That Consume Data

1. **`/rankings`** - Full table with all 106 firms
2. **`/index`** - Dashboard with aggregated metrics
3. **`/firm/?id=X`** - Individual firm profiles
4. **`/data`** - Data sources overview
5. **`/integrity`** - Integrity beacon with hash

---

## Switching to Production Data

To use **real production data** from gpti-data-bot:

1. **Remove/rename test snapshot**:
   ```bash
   mv /opt/gpti/gpti-site/data/test-snapshot.json \
      /opt/gpti/gpti-site/data/test-snapshot.json.backup
   ```

2. **APIs automatically fall back** to MinIO:
   ```
   http://51.210.246.61:9000/gpti-snapshots/
     universe_v0.1_public/_public/latest.json
   ```

3. **Verify** production data has all required fields:
   - score_0_100 ✅
   - jurisdiction_tier ❌ (missing in current production)
   - confidence ❌ (missing in current production)
   - na_rate ❌ (missing in current production)
   - pillar_scores ✅

---

## Production Bot vs Test Generator

### gpti-data-bot (Production)

**Location**: `/opt/gpti/gpti-data-bot/`

**Responsibilities**:
1. **Web Crawling**: Fetch real firm data from websites
2. **Data Extraction**: Parse HTML, extract metrics
3. **Evidence Storage**: Store raw HTML + timestamps in MinIO
4. **Scoring Engine**: Apply methodology spec to compute scores
5. **Oversight Gate**: Validate data quality before publication
6. **Snapshot Creation**: Generate versioned immutable snapshots
7. **MinIO Publication**: Push to production bucket

**Agents (defined in specs)**:
- **Agent A** (Crawling): Fetch firm websites
- **Agent B** (Extraction): Parse data from HTML
- **Agent C** (Oversight Gate): Quality validation
- **Validation Framework**: Ground truth checking

**Output**: Real production-ready snapshots

### generate-test-snapshot.js (Development)

**Location**: `/opt/gpti/gpti-site/scripts/`

**Responsibilities**:
1. **Fetch firm list**: Get names/IDs from production
2. **Generate synthetic data**: Create realistic test values
3. **Output test file**: Save to local data/ folder

**NO real crawling, NO real scoring, NO production impact**

**Output**: Test data for frontend development

---

## Known Limitations

### Current Production Snapshot Issues

The production MinIO snapshot (`36d717685b01.json`) has:
- ❌ All firms = score 42 (placeholder data)
- ❌ All pillar scores identical
- ❌ Missing: jurisdiction_tier, confidence, na_rate
- ✅ Has: firm_id, name, website_root, model_type, status

**Root Cause**: Bot pipeline not fully operational yet

**Solution**: Use test generator until bot produces complete data

### Test Generator Limitations

- ❌ Not real data from actual websites
- ❌ Scores don't reflect real firm quality
- ❌ Historical data is synthetic
- ✅ Perfect for UI/UX testing
- ✅ Shows how site will look with real data
- ✅ Enables frontend development without backend

---

## Deployment Checklist

Before deploying to production:

- [ ] Verify gpti-data-bot is producing complete snapshots
- [ ] Check production snapshot has all required fields
- [ ] Test API fallback to MinIO works correctly
- [ ] Remove or disable test snapshot generation
- [ ] Update environment variables for production
- [ ] Verify CORS headers for MinIO access
- [ ] Test firm profile pages with real data
- [ ] Confirm all 106 firms have varied scores (not all 42)

---

## Troubleshooting

### Symptom: All firms show score 42.0
**Cause**: Using production snapshot (incomplete data)
**Fix**: Regenerate test snapshot: `node scripts/generate-test-snapshot.js`

### Symptom: API returns empty data
**Cause**: Test snapshot file missing
**Fix**: Check `/opt/gpti/gpti-site/data/test-snapshot.json` exists

### Symptom: Pillar scores show "—"
**Cause**: Field mapping issue in firm.tsx
**Fix**: Verify `getMetricValue()` checks pillar_scores object

### Symptom: Hash shows "—"
**Cause**: Looking for wrong field name
**Fix**: Use `firm.sha256` not `snapshot.sha256_hash`

---

## Future Improvements

1. **Add CLI options**:
   ```bash
   node scripts/generate-test-snapshot.js --firms=50 --variance=high
   ```

2. **Sector-specific data**:
   - Generate realistic payout frequencies per model type
   - Jurisdiction distribution based on real market data

3. **Time-series data**:
   - Generate 12 months of historical snapshots
   - Show realistic score evolution patterns

4. **Integration testing**:
   - Automated tests comparing generator output to production schema
   - Validation that all frontend pages render correctly

---

**Last Updated**: February 1, 2026  
**Version**: 1.0  
**Maintainer**: GTIXT Development Team
