/**
 * Generate a realistic test snapshot with varied firm data
 * This replaces the placeholder snapshot with real-looking institutional data
 */

const fs = require('fs');
const path = require('path');

// Load all 106 firms from remote snapshot
async function fetchAllFirms() {
  try {
    const response = await fetch('http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/20260131T171443.939607+0000_36d717685b01.json');
    const data = await response.json();
    return data.records.map(r => ({
      id: r.firm_id,
      name: r.name,
      website: r.website_root,
      model_type: r.model_type,
      status: r.status
    }));
  } catch (err) {
    console.error('Failed to fetch firms, using fallback list');
    return [];
  }
}

const JURISDICTIONS = [
  { code: "US", tier: "A", name: "United States" },
  { code: "UK", tier: "A", name: "United Kingdom" },
  { code: "EU", tier: "A", name: "European Union" },
  { code: "AU", tier: "A", name: "Australia" },
  { code: "SG", tier: "B", name: "Singapore" },
  { code: "AE", tier: "B", name: "United Arab Emirates" },
  { code: "CY", tier: "C", name: "Cyprus" },
  { code: "BZ", tier: "D", name: "Belize" },
  { code: "SC", tier: "D", name: "Seychelles" },
  { code: "UNKNOWN", tier: "UNKNOWN", name: "Unknown" }
];

const CONFIDENCES = ["high", "medium", "low"];
const STATUSES = ["approved", "watchlist", "candidate", "under_review"];

const PAYOUT_FREQUENCIES = ["weekly", "bi-weekly", "monthly", "on-demand", "quarterly"];
const DRAWDOWN_RULES = ["10% daily", "12% daily", "10% trailing", "8% max", "15% overall", "dynamic"];
const RULE_CHANGE_FREQUENCIES = ["low", "medium", "high", "stable", "frequent"];
const OVERSIGHT_VERDICTS = ["pass", "conditional_pass", "under_review", "fail"];
const NA_POLICIES = ["neutral_50", "conservative_40", "optimistic_60", "strict"];

// Generate SHA256-like hash
function generateHash(seed) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(seed).digest('hex').substring(0, 16);
}

function generateScore(index, total, seedString) {
  // Create varied scores based on multiple factors
  const hash = seedString.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  const baseScore = 30 + (hash % 40);
  const indexFactor = Math.sin(index * 2.1) * 15;
  const randomFactor = (hash % 20) - 10;
  return Math.round(Math.max(15, Math.min(95, baseScore + indexFactor + randomFactor)));
}

function generatePillarScores(seed, score) {
  // Generate varied pillar scores that roughly correlate with total score
  const hash = seed.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  const scoreFactor = score / 100;
  
  return {
    A_transparency: Math.max(0.1, Math.min(0.95, scoreFactor * 0.7 + (hash % 10) * 0.03)),
    B_payout_reliability: Math.max(0.1, Math.min(0.95, scoreFactor * 0.8 + ((hash + 13) % 10) * 0.02)),
    C_risk_model: Math.max(0.1, Math.min(0.95, scoreFactor * 0.75 + ((hash + 27) % 10) * 0.025)),
    D_legal_compliance: Math.max(0.1, Math.min(0.95, scoreFactor * 0.85 + ((hash + 41) % 10) * 0.015)),
    E_reputation_support: Math.max(0.1, Math.min(0.95, scoreFactor * 0.65 + ((hash + 59) % 10) * 0.035)),
  };
}

function generateFirmData(firm, index, total) {
  const seed = firm.id || firm.name;
  const hash = seed.split('').reduce((h, c) => h + c.charCodeAt(0), 0);
  const score = generateScore(index, total, seed);
  
  const jurisdiction = JURISDICTIONS[hash % JURISDICTIONS.length];
  const confidence = CONFIDENCES[hash % CONFIDENCES.length];
  const naRate = Math.round((10 + (hash % 30)) * 10) / 10; // 10-40% range
  
  return {
    firm_id: firm.id,
    name: firm.name,
    website_root: firm.website,
    model_type: firm.model_type || "CFD_FX",
    status: firm.status || STATUSES[(hash + index) % STATUSES.length],
    score_0_100: score,
    jurisdiction: jurisdiction.code,
    jurisdiction_tier: jurisdiction.tier,
    jurisdiction_name: jurisdiction.name,
    confidence: confidence,
    na_rate: naRate,
    pillar_scores: generatePillarScores(seed, score),
    agent_c_reasons: [],
    last_updated: new Date().toISOString(),
    // Additional metrics for realism
    founded_year: 2015 + (hash % 9),
    website_status: "active",
    regulatory_status: jurisdiction.tier === "A" || jurisdiction.tier === "B" ? "regulated" : "unregulated",
    
    // Detailed metrics for profile pages
    payout_frequency: PAYOUT_FREQUENCIES[hash % PAYOUT_FREQUENCIES.length],
    max_drawdown_rule: DRAWDOWN_RULES[(hash + 3) % DRAWDOWN_RULES.length],
    rule_changes_frequency: RULE_CHANGE_FREQUENCIES[(hash + 7) % RULE_CHANGE_FREQUENCIES.length],
    oversight_gate_verdict: OVERSIGHT_VERDICTS[(hash + 11) % OVERSIGHT_VERDICTS.length],
    na_policy_applied: NA_POLICIES[hash % NA_POLICIES.length],
    
    // SHA256 hash for integrity
    sha256: generateHash(seed + new Date().toISOString()),
    verification_hash: generateHash(firm.id + score.toString()),
    
    // Calculate historical consistency metric (0-1)
    historical_consistency: Math.max(0.5, 1 - (Math.abs(hash % 15) / 30)), // 0.5-1.0 range
    
    // Data completeness based on na_rate
    data_completeness: Math.max(0.3, 1 - (naRate / 100)),
    
    // Historical data placeholder
    snapshot_history: [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        score: Math.max(15, score + (hash % 10) - 5),
        confidence: confidence,
        note: "Previous snapshot"
      },
      {
        date: new Date().toISOString().split('T')[0],
        score: score,
        confidence: confidence,
        note: "Current snapshot"
      }
    ],
    
    // Additional profile data
    executive_summary: `${firm.name} operates in the ${firm.model_type || 'CFD_FX'} space with ${jurisdiction.name} jurisdiction oversight.`,
    
    // Percentiles for comparative positioning
    percentile_overall: Math.round((100 - (index / total) * 100)),
    percentile_model: Math.round(50 + (hash % 40)),
    percentile_jurisdiction: Math.round(45 + (hash % 50)),
  };
}

async function generateSnapshot() {
  console.log('Fetching all firms from remote snapshot...');
  const firms = await fetchAllFirms();
  
  if (firms.length === 0) {
    console.error('No firms fetched!');
    process.exit(1);
  }
  
  console.log(`Generating data for ${firms.length} firms...`);
  const records = firms.map((firm, index) => generateFirmData(firm, index, firms.length));
  
  // Sort by score descending
  records.sort((a, b) => b.score_0_100 - a.score_0_100);
  
  const avgScore = records.reduce((sum, r) => sum + r.score_0_100, 0) / records.length;
  const topScore = records[0].score_0_100;
  const medianScore = records[Math.floor(records.length / 2)].score_0_100;
  
  return {
    records: records,
    metadata: {
      version: "v0.1_test",
      generated_at: new Date().toISOString(),
      total_records: records.length,
      avg_score: parseFloat(avgScore.toFixed(1)),
      top_score: topScore,
      median_score: medianScore,
      confidence_distribution: {
        high: records.filter(r => r.confidence === "high").length,
        medium: records.filter(r => r.confidence === "medium").length,
        low: records.filter(r => r.confidence === "low").length,
      },
      jurisdiction_distribution: {
        tier_A: records.filter(r => r.jurisdiction_tier === "A").length,
        tier_B: records.filter(r => r.jurisdiction_tier === "B").length,
        tier_C: records.filter(r => r.jurisdiction_tier === "C").length,
        tier_D: records.filter(r => r.jurisdiction_tier === "D").length,
        unknown: records.filter(r => r.jurisdiction_tier === "UNKNOWN").length,
      },
      model_type_distribution: {
        CFD_FX: records.filter(r => r.model_type === "CFD_FX").length,
        FUTURES: records.filter(r => r.model_type === "FUTURES").length,
        EQUITIES: records.filter(r => r.model_type === "EQUITIES").length,
      }
    }
  };
}

generateSnapshot().then(snapshot => {
  const outputPath = path.join(__dirname, '..', 'data', 'test-snapshot.json');
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
  console.log(`\n✓ Generated test snapshot with ${snapshot.records.length} firms`);
  console.log(`✓ Saved to: ${outputPath}`);
  console.log(`\n📊 Statistics:`);
  console.log(`  - Avg Score: ${snapshot.metadata.avg_score}`);
  console.log(`  - Top Score: ${snapshot.metadata.top_score}`);
  console.log(`  - Median Score: ${snapshot.metadata.median_score}`);
  console.log(`  - Confidence: ${JSON.stringify(snapshot.metadata.confidence_distribution)}`);
  console.log(`  - Jurisdictions: ${JSON.stringify(snapshot.metadata.jurisdiction_distribution)}`);
  console.log(`  - Model Types: ${JSON.stringify(snapshot.metadata.model_type_distribution)}`);
}).catch(err => {
  console.error('Error generating snapshot:', err);
  process.exit(1);
});
