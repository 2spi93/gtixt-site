'use client';

import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import InstitutionalHeader from "../components/InstitutionalHeader";
import VerificationWidget from "../components/VerificationWidget";
import ScoreTrajectory from "../components/ScoreTrajectory";
import PageNavigation from "../components/PageNavigation";
import { useTranslation } from "../lib/useTranslationStub";
import type { NormalizedFirm } from "../lib/types";

interface FirmRecord extends Partial<Omit<NormalizedFirm, 'confidence'>> {
  status_gtixt?: string;
  integrity_score?: number;
  score?: number;
  confidence?: string | number;
  percentile_overall?: number;
  percentile_model?: number;
  confidence_string?: string;
  snapshot_history?: Array<{ date: string; score?: number; confidence?: string; note?: string }>;
  transparency?: number;
  compliance?: number;
  operational?: number;
  technology?: number;
  risk_management?: number;
  client_protection?: number;
  financial_stability?: number;
  pillar_scores?: {
    regulatory_compliance?: number;
    financial_stability?: number;
    operational_risk?: number;
    technology_infrastructure?: number;
    governance_structure?: number;
    client_protection?: number;
    market_conduct?: number;
    A_transparency?: number;
    B_payout_reliability?: number;
    C_risk_model?: number;
    D_legal_compliance?: number;
    E_reputation_support?: number;
  };
  last_updated?: string;
  data_sources?: string[];
  verification_hash?: string;
  [key: string]: unknown;
}

interface LatestSnapshot {
  snapshot_id?: string;
  record_count?: number;
  sha256_hash?: string;
  sha256?: string;
  snapshot_uri?: string;
  timestamp?: string;
  created_at?: string;
  object?: string;
  count?: number;
}

const DEFAULT_LATEST_URL =
  "/snapshots/universe_v0.1_public/_public/latest.json";

const DEFAULT_BUCKET_BASE =
  "/snapshots";

const PILLARS = [
  {
    key: "A_transparency",
    label: "Transparency & Rules Clarity",
    icon: "🔎",
    sources: ["A_transparency", "transparency", "compliance", "regulatory_compliance"],
  },
  {
    key: "B_payout_reliability",
    label: "Payout Reliability",
    icon: "💸",
    sources: ["B_payout_reliability", "financial_stability", "payout_reliability"],
  },
  {
    key: "C_risk_model",
    label: "Risk Model Integrity",
    icon: "🧠",
    sources: ["C_risk_model", "risk_management", "operational_risk"],
  },
  {
    key: "D_legal_compliance",
    label: "Jurisdiction & Legal Exposure",
    icon: "⚖️",
    sources: ["D_legal_compliance", "governance_structure", "regulatory_compliance"],
  },
  {
    key: "E_reputation_support",
    label: "Operational Stability",
    icon: "🛠️",
    sources: ["E_reputation_support", "operational", "operational_risk"],
  },
  {
    key: "data_completeness",
    label: "Data Completeness",
    icon: "📦",
    sources: ["data_completeness", "na_rate"],
  },
  {
    key: "historical_consistency",
    label: "Historical Consistency",
    icon: "🧭",
    sources: ["historical_consistency"],
  },
];

const DATA_COVERAGE_KEYS = [
  "payout_frequency",
  "max_drawdown_rule",
  "daily_drawdown_rule",
  "rule_changes_frequency",
  "jurisdiction",
  "jurisdiction_tier",
  "headquarters",
  "founded_year",
];

const DATA_FIELD_LABELS: Record<string, string> = {
  payout_frequency: "Payout frequency",
  max_drawdown_rule: "Max drawdown rule",
  daily_drawdown_rule: "Daily drawdown rule",
  rule_changes_frequency: "Rule changes frequency",
  jurisdiction: "Jurisdiction",
  jurisdiction_tier: "Jurisdiction tier",
  headquarters: "Headquarters",
  founded_year: "Founded year",
};

const FUTURE_INDICATORS = [
  {
    key: "stress_scenario",
    title: "Stress Scenario Simulation",
    desc: "Structural stress deltas across regulatory, rules, model, and data completeness conditions.",
    status: "Planned",
  },
  {
    key: "regulatory_impact",
    title: "Regulatory Impact Indicator",
    desc: "Weighted sensitivity to ESMA/FCA/ASIC/AMF shifts by model and jurisdiction.",
    status: "Planned",
  },
  {
    key: "survivability",
    title: "Survivability Score",
    desc: "Structural resilience under normal conditions (non-prospective).",
    status: "Planned",
  },
  {
    key: "institutional_readiness",
    title: "Institutional Readiness Score",
    desc: "Auditability, documentation clarity, and onboarding fitness for institutions.",
    status: "Planned",
  },
  {
    key: "index_inclusion",
    title: "Index Inclusion Readiness",
    desc: "Eligibility alignment with GTIXT index criteria (non-probabilistic).",
    status: "Planned",
  },
  {
    key: "reg_exposure_map",
    title: "Regulatory Exposure Map",
    desc: "Matrix of operating, client, regulator-mention, and model-risk jurisdictions.",
    status: "Planned",
  },
  {
    key: "rule_volatility",
    title: "Rule Volatility Index (RVI)",
    desc: "Frequency, amplitude, and impact of rule changes with historical stability.",
    status: "Planned",
  },
  {
    key: "operational_footprint",
    title: "Operational Footprint",
    desc: "Domain sprawl, hosting stack, CDN/cloud footprint, redirections, uptime.",
    status: "Planned",
  },
  {
    key: "payout_consistency",
    title: "Payout Ledger Consistency (PLC)",
    desc: "Internal consistency of payout rules, timelines, and conditions.",
    status: "Planned",
  },
  {
    key: "model_archetype",
    title: "Model Archetype Classification (MAC)",
    desc: "GTIXT taxonomy: 1-step, 2-step, instant funding, hybrid, subscription, etc.",
    status: "Planned",
  },
  {
    key: "rule_ambiguity",
    title: "Rule Ambiguity Heatmap",
    desc: "Visual coverage of clear, ambiguous, contradictory, or missing rules.",
    status: "Planned",
  },
  {
    key: "ai_red_flags",
    title: "AI-Detected Red Flags",
    desc: "Neutral inconsistencies detected across FAQ, terms, and pricing.",
    status: "Planned",
  },
  {
    key: "jurisdiction_risk_tier",
    title: "Jurisdictional Risk Tier (JRT)",
    desc: "Matrix-driven tiering by registration, history, stability, transparency.",
    status: "Planned",
  },
  {
    key: "model_integrity_score",
    title: "GTIXT Model Integrity Score",
    desc: "Internal coherence between rules, pricing, and historical stability.",
    status: "Planned",
  },
  {
    key: "future_risk_projection",
    title: "Future Risk Projection (R&D)",
    desc: "Internal projection using change frequency, ambiguity, and jurisdictional drift.",
    status: "R&D",
  },
];

const PRO_FEATURES = [
  {
    key: "rvi",
    title: "Rule Volatility Index (RVI)",
    desc: "Monthly rule-change volatility scoring and historical drift view.",
  },
  {
    key: "plc",
    title: "Payout Ledger Consistency (PLC)",
    desc: "Structural payout rule consistency and anomaly tagging.",
  },
  {
    key: "ambiguity_heatmap",
    title: "Rule Ambiguity Heatmap",
    desc: "Clear vs ambiguous vs missing rule coverage visualization.",
  },
  {
    key: "reg_exposure_map",
    title: "Regulatory Exposure Map",
    desc: "Jurisdiction matrix for operations, clients, and regulator mentions.",
  },
  {
    key: "timeline",
    title: "Firm Historical Timeline",
    desc: "Extended snapshot history with change annotations.",
  },
  {
    key: "survivability",
    title: "Survivability Score",
    desc: "Quarterly structural resilience index (non-prospective).",
  },
  {
    key: "institutional_readiness",
    title: "Institutional Readiness Score",
    desc: "Composite onboarding readiness for institutional standards.",
  },
  {
    key: "advanced_exports",
    title: "Advanced Exports & Full API",
    desc: "Expanded data exports and complete API access.",
  },
];

const PRO_SECTION_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PRO_SECTIONS === "true";

const AGENT_ARCHITECTURE = [
  {
    key: "reality_engine",
    title: "Agent 1 — Reality Engine",
    desc: "Measures what exists: crawl, extract, verify, score, audit, validation, snapshots.",
  },
  {
    key: "market_intelligence",
    title: "Agent 2 — Market Intelligence Engine",
    desc: "Detects what emerges: new firms, rule/pricing shifts, regulatory signals, model classification.",
  },
  {
    key: "integrity_governance",
    title: "Agent 3 — Integrity & Governance Engine",
    desc: "Protects the system: healthchecks, score drift, snapshot integrity, compliance, alerts.",
  },
];

const getNestedValue = (obj: Record<string, unknown> | null | undefined, path: string): unknown => {
  if (!obj) return undefined;
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as Record<string, unknown> | undefined);
};

const getMetricValue = (record: FirmRecord | null, keys: string[]): unknown => {
  if (!record) return undefined;
  for (const key of keys) {
    // First check directly in record object
    const directValue = (record as Record<string, unknown>)[key];
    if (directValue !== undefined && directValue !== null && directValue !== "") return directValue;
    // Then check nested paths
    const direct = getNestedValue(record as Record<string, unknown>, key);
    if (direct !== undefined && direct !== null && direct !== "") return direct;
    // Check metric_scores
    const metricScores = record.metric_scores || {};
    const metricValue = getNestedValue(metricScores, key);
    if (metricValue !== undefined && metricValue !== null && metricValue !== "") return metricValue;
    // Check pillar_scores for pillar keys like A_transparency, B_payout_reliability, etc
    const pillarScores = record.pillar_scores || {};
    const pillarValue = getNestedValue(pillarScores, key);
    if (pillarValue !== undefined && pillarValue !== null && pillarValue !== "") return pillarValue;
  }
  return undefined;
};

const toPct = (value?: number, digits = 1): string => {
  if (typeof value !== "number") return "—";
  return `${(value * 100).toFixed(digits)}%`;
};

const formatPercentValue = (value?: number | string, digits = 1): string => {
  if (value === undefined || value === null || value === "") return "—";
  let numValue: number;
  if (typeof value === "string") {
    numValue = parseFloat(value);
    if (isNaN(numValue)) return "—";
  } else {
    numValue = value;
  }
  // If value > 1, assume it's 0-100 format; if 0-1, multiply by 100
  const percent = numValue > 1 ? numValue : numValue * 100;
  return `${percent.toFixed(digits)}%`;
};

const MISSING_VALUE = "Not available";

const toDisplayValue = (value: unknown, fallback = MISSING_VALUE): string => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "—") return fallback;
    return trimmed;
  }
  return String(value);
};

const toDisplayPercent = (value?: number | string, digits = 1): string => {
  const formatted = formatPercentValue(value, digits);
  return formatted === "—" ? MISSING_VALUE : formatted;
};

const toScore100 = (value?: number): string => {
  if (typeof value !== "number") return "—";
  const normalized = value > 1 ? value / 100 : value;
  return `${Math.round(normalized * 100)}`;
};

const formatConfidence = (confidence?: string | number): string => {
  if (!confidence) return "—";
  if (typeof confidence === "number") {
    return `${Math.round(confidence * 100)}%`;
  }
  return String(confidence).toUpperCase();
};

const getMetricStatus = (key: string, value: unknown): string => {
  if (value === undefined || value === null || value === "") return "—";
  if (key === "na_rate" && typeof value === "number") return value > 0.2 ? "⚠" : "✔";
  if (key === "data_completeness" && typeof value === "number") {
    if (value >= 0.75) return "✔";
    if (value >= 0.45) return "○";
    return "⚠";
  }
  if (key === "rule_changes_frequency") {
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower.includes("high") || lower.includes("frequent")) return "⚠";
      if (lower.includes("low") || lower.includes("rare")) return "✔";
      if (lower.includes("stable") || lower.includes("medium") || lower.includes("moderate")) return "○";
      return "○";
    }
    if (typeof value === "number") return value > 3 ? "⚠" : "✔";
  }
  return "✔";
};

const buildExecutiveSummary = (record: FirmRecord | null): string => {
  if (record?.executive_summary) return record.executive_summary;
  const jurisdiction = record?.jurisdiction || "multiple jurisdictions";
  const confidence = record?.confidence ? formatConfidence(record.confidence) : "—";
  const completenessValue =
    typeof record?.data_completeness === "number"
      ? record.data_completeness
      : typeof record?.na_rate === "number"
      ? 1 - record.na_rate
      : undefined;
  const completenessDisplay = typeof completenessValue === "number" ? toPct(completenessValue, 1) : "—";
  const modelType = record?.model_type || "proprietary trading";
  const score = record?.score_0_100 || record?.score || 0;
  const normalizedScore = score > 1 ? score / 100 : score;
  const scoreBand = normalizedScore >= 0.8 ? "structurally strong" : normalizedScore >= 0.6 ? "viable" : "requires review";
  
  return `${record?.name || record?.firm_name || "This firm"} operates a ${modelType} model with primary exposure in ${jurisdiction}. The GTIXT composite score (${Math.round(normalizedScore * 100)}) indicates a ${scoreBand} operating profile. Assessment confidence is ${confidence}, with data coverage at ${completenessDisplay}. Key institutional considerations include risk model documentation, payout reliability tracking, regulatory compliance status, and operational stability metrics detailed below.`;
};

const buildInterpretation = (record: FirmRecord | null, score?: number): string => {
  const normalized = typeof score === "number" ? (score > 1 ? score / 100 : score) : undefined;
  const scoreBand =
    normalized === undefined
      ? "an indeterminate" : normalized >= 0.8
        ? "a structurally resilient"
        : normalized >= 0.6
          ? "a viable"
          : "a fragile";
  const confidence = formatConfidence(record?.confidence);
  return `This score indicates ${scoreBand} operating profile under normal market conditions, with sensitivity to rule or jurisdictional changes. Confidence is ${confidence}; interpretation should be weighted by data coverage and snapshot recency.`;
};

const getScoreBadge = (score?: number): string => {
  if (!score) return "—";
  if (score >= 0.8) return "PASS";
  if (score >= 0.6) return "REVIEW";
  return "FLAG";
};

const getScoreColor = (score?: number): string => {
  if (!score) return "rgba(255,255,255,0.5)";
  if (score >= 0.8) return "#3FB950";
  if (score >= 0.6) return "#F0A500";
  if (score >= 0.4) return "#F0A500";
  return "#D64545";
};

const getPillarColor = (score?: number): string => {
  if (!score) return "rgba(63, 185, 80, 0.15)";
  if (score >= 0.8) return "rgba(63, 185, 80, 0.15)";
  if (score >= 0.6) return "rgba(240, 165, 0, 0.15)";
  if (score >= 0.4) return "rgba(212, 69, 69, 0.15)";
  return "rgba(212, 69, 69, 0.2)";
};

const inferJurisdictionFromUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  try {
    const url = value.startsWith("http") ? new URL(value) : new URL(`https://${value}`);
    const host = url.hostname.toLowerCase();
    const tld = host.split(".").slice(-2).join(".");
    const tldMap: Record<string, string> = {
      "co.uk": "United Kingdom",
      "uk": "United Kingdom",
      "com.au": "Australia",
      "au": "Australia",
      "ca": "Canada",
      "us": "United States",
      "ie": "Ireland",
      "fr": "France",
      "de": "Germany",
      "es": "Spain",
      "it": "Italy",
      "nl": "Netherlands",
      "be": "Belgium",
      "se": "Sweden",
      "no": "Norway",
      "dk": "Denmark",
      "fi": "Finland",
      "ch": "Switzerland",
      "at": "Austria",
      "pl": "Poland",
      "cz": "Czech Republic",
      "pt": "Portugal",
      "sg": "Singapore",
      "hk": "Hong Kong",
      "jp": "Japan",
      "cn": "China",
      "in": "India",
      "br": "Brazil",
      "mx": "Mexico",
      "za": "South Africa",
      "ae": "United Arab Emirates",
      "eu": "European Union",
      "io": "International",
      "com": "Global",
      "net": "Global",
      "org": "Global",
      "co": "Global",
    };
    return tldMap[tld] || tldMap[host.split(".").pop() || ""];
  } catch {
    return undefined;
  }
};

const normalizeScoreValue = (value: unknown): number | undefined => {
  if (typeof value === "number") return value > 1 ? value : value * 100;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return undefined;
    return numeric > 1 ? numeric : numeric * 100;
  }
  return undefined;
};

const normalizeFirmRecord = (record: FirmRecord | null): FirmRecord | null => {
  if (!record) return record;
  const metricScores = record.metric_scores as Record<string, unknown> | undefined;
  const normalizedScore = normalizeScoreValue(
    record.score_0_100 ?? record.integrity_score ?? record.score ?? metricScores?.score_0_100 ?? metricScores?.score
  );
  
  let normalizedConfidence: string | number | undefined = record.confidence;
  if (!normalizedConfidence && typeof metricScores?.confidence === "string") {
    normalizedConfidence = metricScores.confidence as string;
  }
  if (!normalizedConfidence) {
    if (record.status_gtixt === "watchlist") normalizedConfidence = "low";
    else if (record.status_gtixt === "candidate") normalizedConfidence = "medium";
  }

  return {
    ...record,
    firm_name: record.firm_name || record.name || (record.firm_id ? String(record.firm_id) : undefined),
    name: record.name || record.firm_name || (record.firm_id ? String(record.firm_id) : undefined),
    score_0_100: normalizedScore ?? record.score_0_100,
    score: normalizedScore ?? record.score,
    confidence: normalizedConfidence as string | number | undefined,
    na_rate: typeof record.na_rate === "number" && record.na_rate > 1 ? record.na_rate / 100 : record.na_rate,
    jurisdiction: (record.jurisdiction || record.jurisdiction_tier) as string | undefined,
  };
};

export default function FirmTearsheet() {
  const router = useRouter();
  const { id, name } = router.query;
  const { t } = useTranslation("common");

  const [firm, setFirm] = useState<FirmRecord | null>(null);
  const [snapshot, setSnapshot] = useState<LatestSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only proceed if router is ready AND we have a query parameter
    if (!router.isReady) {
      return;
    }

    const queryId = Array.isArray(id) ? id[0] : (id as string | undefined);
    const queryName = Array.isArray(name) ? name[0] : (name as string | undefined);
    
    if (!queryId && !queryName) {
      setLoading(false);
      setError("No firm specified");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use internal API endpoint to fetch firm data
        const queryParams = new URLSearchParams();
        if (queryId) queryParams.append("id", queryId);
        if (queryName) queryParams.append("name", queryName);
        
        console.log(`[Firm Page] Fetching firm data: ${queryParams.toString()}`);
        const apiRes = await fetch(`/api/firm/?${queryParams.toString()}`);
        
        if (!apiRes.ok) {
          const errorData = await apiRes.json().catch(() => ({}));
          const errorMsg = errorData.error || `HTTP ${apiRes.status}`;
          console.error(`[Firm Page] API Error: ${errorMsg}`);
          throw new Error(errorMsg);
        }
        
        const apiData = await apiRes.json();
        console.log(`[Firm Page] Received data:`, apiData);
        setFirm(normalizeFirmRecord(apiData.firm));
        if (apiData.snapshot) {
          setSnapshot({
            ...apiData.snapshot,
            snapshot_uri: apiData.snapshot.object
              ? `/snapshots/${apiData.snapshot.object}`
              : "",
          });
        }
        
        // Redirect to ID-based URL if name-based lookup
        if (!queryId && queryName && apiData.firm?.firm_id) {
          router.replace(`/firm?id=${encodeURIComponent(apiData.firm.firm_id)}`, undefined, { shallow: true });
        }
        setLoading(false);
        console.log(`[Firm Page] Loading complete for firm: ${apiData.firm?.firm_name || queryId}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Firm Page] Error loading firm:`, errorMsg, err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    loadData();
  }, [id, name, router.isReady, router]);

  // Ensure name is a string (not array from next/router)
  const firmIdParam = Array.isArray(id) ? id[0] : (id as string | undefined);
  const firmNameParam = Array.isArray(name) ? name[0] : (name as string | undefined);
  const firmName = firm?.firm_name || firm?.name || firmNameParam || firmIdParam || "Unknown Firm";
  const rawScore = (firm?.score_0_100 || firm?.integrity_score || firm?.score || 0) as number;
  const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore;
  const scoreLabel = toScore100(rawScore);
  const confidence = formatConfidence(firm?.confidence);
  const jurisdictionRaw =
    firm?.jurisdiction ||
    inferJurisdictionFromUrl((getMetricValue(firm, ["website_root", "website", "homepage"]) as string) || "") ||
    undefined;
  const jurisdiction = toDisplayValue(jurisdictionRaw);
  const naRate = typeof firm?.na_rate === "number" ? firm.na_rate : undefined;
  const dataCompletenessRaw = getMetricValue(firm, ["data_completeness", "data.completeness"]) as number | undefined;
  const dataCompleteness =
    typeof dataCompletenessRaw === "number"
      ? dataCompletenessRaw > 1
        ? dataCompletenessRaw / 100
        : dataCompletenessRaw
      : undefined;
  const dataBadgeRaw = getMetricValue(firm, ["data_badge"]) as string | undefined;
  const inferredDataBadge = dataBadgeRaw
    ? String(dataBadgeRaw).toLowerCase()
    : typeof dataCompleteness === "number"
    ? dataCompleteness >= 0.75
      ? "complete"
      : dataCompleteness >= 0.45
      ? "partial"
      : "incomplete"
    : undefined;
  const dataBadgeLabel = inferredDataBadge
    ? inferredDataBadge.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : undefined;
  const apiMissingFields = Array.isArray(firm?.data_missing_fields)
    ? (firm?.data_missing_fields as string[])
    : [];
  const fallbackMissingFields = apiMissingFields.length
    ? []
    : DATA_COVERAGE_KEYS.filter((key) => {
        const value = (firm as Record<string, unknown> | null)?.[key];
        if (value === undefined || value === null || value === "") return true;
        if (Array.isArray(value) && value.length === 0) return true;
        return false;
      });
  const dataMissingFields = apiMissingFields.length ? apiMissingFields : fallbackMissingFields;
  const dataMissingCount = dataMissingFields.length;
  const dataMissingDisplay = dataMissingCount
    ? dataMissingFields.map((key) => DATA_FIELD_LABELS[key] || key).join(", ")
    : "None";
  const statusRaw = (getMetricValue(firm, ["status", "status_gtixt", "gtixt_status"]) as string) || "Under Review";
  const statusNormalized = statusRaw.toLowerCase().replace(/_/g, " ").trim();
  const statusDisplay = statusNormalized
    ? statusNormalized.replace(/\b\w/g, (char) => char.toUpperCase())
    : "Under Review";
  const foundedYear = getMetricValue(firm, ["founded_year", "year_founded", "year_established"]) as string | number | undefined;
  const foundedDate = getMetricValue(firm, ["founded", "founded_date", "founded_at"]) as string | undefined;
  const foundedDisplay = toDisplayValue(foundedDate || foundedYear);
  const logoUrl = (getMetricValue(firm, ["logo_url", "logo", "brand_logo"]) as string) || "";
  const jurisdictionTierRaw = (getMetricValue(firm, ["jurisdiction_tier", "legal.jurisdiction_tier"]) as string | undefined) || undefined;
  const jurisdictionTier = toDisplayValue(jurisdictionTierRaw);
  const modelTypeRaw = (getMetricValue(firm, ["model_type", "meta.model_type"]) as string | undefined) || undefined;
  const modelType = toDisplayValue(modelTypeRaw);
  const payoutFrequencyRaw = (getMetricValue(firm, ["payout_frequency", "payouts.frequency"]) as string | undefined) || undefined;
  const payoutFrequency = toDisplayValue(payoutFrequencyRaw);
  const maxDrawdownRuleRaw = (getMetricValue(firm, ["max_drawdown_rule", "risk.max_drawdown_rule"]) as number | string | undefined) || undefined;
  const maxDrawdownRule = toDisplayPercent(maxDrawdownRuleRaw);
  const dailyDrawdownRuleRaw =
    (getMetricValue(firm, ["daily_drawdown_rule", "risk.daily_drawdown_rule"]) as number | string | undefined) ||
    (firm?.daily_drawdown_rule as number | string | undefined) ||
    undefined;
  const dailyDrawdownRule = toDisplayPercent(dailyDrawdownRuleRaw);
  const ruleChangesFrequencyRaw = (getMetricValue(firm, ["rule_changes_frequency", "rules.change_frequency"]) as string | undefined) || undefined;
  const ruleChangesFrequency = toDisplayValue(ruleChangesFrequencyRaw);
  const oversightVerdict =
    (getMetricValue(firm, ["oversight_gate_verdict", "audit_verdict", "oversight.verdict"]) as string) || "—";
  const naPolicyValue = getMetricValue(firm, ["na_policy_applied", "na_policy"]) as unknown;
  const naPolicy =
    typeof naPolicyValue === "boolean"
      ? naPolicyValue
        ? "Yes"
        : "No"
      : naPolicyValue
      ? String(naPolicyValue)
      : MISSING_VALUE;
  const payoutReliability = (getMetricValue(firm, ["payout_reliability", "B_payout_reliability"]) as number | undefined) ?? firm?.payout_reliability;
  const riskModelIntegrity = (getMetricValue(firm, ["risk_model_integrity", "C_risk_model"]) as number | undefined) ?? firm?.risk_model_integrity;
  const operationalStability = (getMetricValue(firm, ["operational_stability", "E_reputation_support"]) as number | undefined) ?? firm?.operational_stability;
  const payoutReliabilityDisplay = toDisplayPercent(payoutReliability);
  const riskModelIntegrityDisplay = toDisplayPercent(riskModelIntegrity);
  const operationalStabilityDisplay = toDisplayPercent(operationalStability);
  const snapshotId =
    (getMetricValue(firm, ["snapshot_id"]) as string) ||
    firm?.snapshot_id ||
    snapshot?.snapshot_id ||
    snapshot?.object ||
    "—";
  const sha256Hash =
    (getMetricValue(firm, ["sha256", "verification_hash", "sha256_hash"]) as string) ||
    snapshot?.sha256 ||
    "—";
  const percentileUniverse = ((getMetricValue(firm, ["percentile_vs_universe", "percentile_overall", "percentile_universe"]) as number | undefined) ?? firm?.percentile_vs_universe);
  const percentileModelType = ((getMetricValue(firm, ["percentile_vs_model_type", "percentile_model"]) as number | undefined) ?? firm?.percentile_vs_model_type);
  const percentileJurisdiction = ((getMetricValue(firm, ["percentile_vs_jurisdiction", "percentile_jurisdiction"]) as number | undefined) ?? firm?.percentile_vs_jurisdiction);
  
  // Calculate historical consistency from snapshot_history
  const historicalConsistency = (() => {
    if (!firm?.snapshot_history || !Array.isArray(firm.snapshot_history) || firm.snapshot_history.length < 2) {
      return "—";
    }
    const history = firm.snapshot_history as Array<{ score?: number }>;
    const scores = history.map(h => h.score).filter((s): s is number => typeof s === 'number');
    if (scores.length < 2) return "—";
    
    const variance = scores.reduce((sum, score) => {
      const diff = score - (scores.reduce((a, b) => a + b, 0) / scores.length);
      return sum + diff * diff;
    }, 0) / scores.length;
    
    const stdDev = Math.sqrt(variance);
    if (stdDev < 5) return "stable";
    if (stdDev < 10) return "moderate";
    return "volatile";
  })();

  // Analyze score trajectory for institutional interpretation
  const scoreTrajectoryAnalysis = (() => {
    if (!firm?.snapshot_history || !Array.isArray(firm.snapshot_history) || firm.snapshot_history.length < 2) {
      return { interpretation: "Insufficient data for trajectory analysis", change: 0, trend: "unknown" };
    }
    const history = (firm.snapshot_history as Array<{ date?: string; score?: number }>)
      .filter(h => typeof h.score === 'number')
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
    
    if (history.length < 2) return { interpretation: "Single snapshot available", change: 0, trend: "unknown" };
    
    const firstScore = (history[0].score! > 1 ? history[0].score! / 100 : history[0].score!) * 100;
    const lastScore = (history[history.length - 1].score! > 1 ? history[history.length - 1].score! / 100 : history[history.length - 1].score!) * 100;
    const change = Math.round((lastScore - firstScore) * 10) / 10;
    const days = Math.round((new Date(history[history.length - 1].date || 0).getTime() - new Date(history[0].date || 0).getTime()) / (1000 * 60 * 60 * 24));
    const period = days > 90 ? "90+ days" : days > 30 ? `${Math.round(days / 7)} weeks` : `${days} days`;
    
    let trend = "stable";
    if (Math.abs(change) > 8) trend = change > 0 ? "rising" : "falling";
    else if (Math.abs(change) > 3) trend = change > 0 ? "improving" : "declining";
    
    const interpretation = change > 0 
      ? `${firmName} demonstrates ${trend} trajectory with +${change} improvement over ${period}`
      : change < 0
      ? `${firmName} shows ${trend} trend with ${change} decline over ${period}`
      : `${firmName} maintains consistent performance over ${period}`;
    
    return { interpretation, change, trend, period, daysSpan: days };
  })();
  
  const executiveSummary = buildExecutiveSummary(firm);
  const interpretation = buildInterpretation(firm, rawScore);
  const [firmHistory, setFirmHistory] = useState<Array<{date: string; score?: number; confidence?: string; note?: string}>>(
    (firm?.snapshot_history as Array<{ date: string; score?: number; confidence?: string; note?: string }>) || []
  );
  
  // Load historical data from API when firm changes
  useEffect(() => {
    if (firm?.firm_id) {
      const loadHistory = async () => {
        try {
          const res = await fetch(`/api/firm-history/?id=${encodeURIComponent(firm.firm_id)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.history && data.history.length > 0) {
              setFirmHistory(data.history);
              console.log(`[Firm Page] Loaded ${data.history.length} historical snapshots`);
            }
          }
        } catch (err) {
          console.debug('[Firm Page] Could not load history from API, using snapshot_history');
        }
      };
      loadHistory();
    }
  }, [firm?.firm_id]);

  const baseHistory =
    firmHistory && firmHistory.length > 0
      ? firmHistory
      : (firm?.snapshot_history as Array<{ date: string; score?: number; confidence?: string; note?: string }>) ||
        (snapshot?.timestamp || snapshot?.created_at
          ? [{ date: snapshot.timestamp || snapshot.created_at || "", note: "Snapshot published" }]
          : []);

  const snapshotHistory = Array.from(
    new Map(
      baseHistory.map((item) => {
        const key = [item.date, item.score, item.confidence, item.note]
          .map((value) => String(value ?? ""))
          .join("|");
        return [key, item];
      })
    ).values()
  ).sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  const metricRows: Array<{ key: string; label: string; value: unknown; display: string }> = [
    { key: "payout_frequency", label: "Payout frequency", value: payoutFrequencyRaw, display: payoutFrequency },
    { key: "max_drawdown_rule", label: "Max drawdown rule", value: maxDrawdownRuleRaw, display: maxDrawdownRule },
    { key: "daily_drawdown_rule", label: "Daily drawdown rule", value: dailyDrawdownRuleRaw, display: dailyDrawdownRule },
    { key: "rule_changes_frequency", label: "Rule changes frequency", value: ruleChangesFrequencyRaw, display: ruleChangesFrequency },
    { key: "data_completeness", label: "Data completeness", value: dataCompleteness, display: toDisplayPercent(dataCompleteness, 1) },
    { key: "data_missing_fields", label: "Missing fields", value: dataMissingFields, display: dataMissingDisplay },
    { key: "na_rate", label: "NA rate", value: naRate, display: toDisplayPercent(naRate, 1) },
    { key: "jurisdiction_tier", label: "Jurisdiction tier", value: jurisdictionTierRaw, display: jurisdictionTier },
    { key: "model_type", label: "Model type", value: modelTypeRaw, display: modelType },
  ];

  const detailValueStyle = (value: string) =>
    value === MISSING_VALUE ? { ...styles.detailValue, ...styles.missingValue } : styles.detailValue;

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Firm Tearsheet - GTIXT</title>
        </Head>
        <InstitutionalHeader />
        <div style={styles.container}>
          <div style={styles.loading}>Loading firm data...</div>
        </div>
      </>
    );
  }

  if (error || !firm) {
    console.error(`[Firm Page] Rendering error state: ${error || "No firm data"}`);
    return (
      <>
        <Head>
          <title>Firm Not Found - GTIXT</title>
        </Head>
        <InstitutionalHeader />
        <div style={styles.container}>
          <div style={styles.error}>{error || "Firm not found"}</div>
          <Link href="/rankings" style={styles.link}>
            ← Back to Rankings
          </Link>
        </div>
      </>
    );
  }

  const initials = firmName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <>
      <Head>
        <title>{firmName} - Prop Firm Profile - GTIXT</title>
        <meta name="description" content={`Institutional prop firm profile for ${firmName}. GTIXT composite score, audit trail, and standardized metrics.`} />
      </Head>

      <InstitutionalHeader
        breadcrumbs={[
          { label: "Rankings", href: "/rankings" },
          { label: firmName, href: `/firm?id=${encodeURIComponent(firm?.firm_id || firmIdParam || firmName)}` },
        ]}
      />

      {/* Navigation principale */}
      <div style={styles.container}>
        <PageNavigation />
        
        {/* 1) Header institutionnel (Identity Block) */}
        <section style={styles.identityBlock}>
          <div style={styles.identityLeft}>
            <div style={styles.logoWrap}>
              {logoUrl ? (
                <Image src={logoUrl} alt={`${firmName} logo`} width={72} height={72} style={styles.logo} />
              ) : (
                <div style={styles.logoFallback}>{initials}</div>
              )}
            </div>
            <div>
              <div style={styles.identityName}>{firmName}</div>
              <div style={styles.identityMeta}>
                <span style={styles.metaPill}>{jurisdiction}</span>
                <span style={styles.metaPill}>Founded {foundedDisplay}</span>
                <span
                  style={{
                    ...styles.metaPill,
                    ...styles.statusPill,
                    ...(statusNormalized === "pass"
                      ? styles.statusPillPass
                      : statusNormalized === "review"
                      ? styles.statusPillReview
                      : statusNormalized === "fail"
                      ? styles.statusPillFail
                      : {}),
                  }}
                >
                  {statusDisplay}
                </span>
                {dataBadgeLabel && (
                  <span
                    style={{
                      ...styles.metaPill,
                      ...(inferredDataBadge === "complete"
                        ? styles.dataBadgeComplete
                        : inferredDataBadge === "partial"
                        ? styles.dataBadgePartial
                        : styles.dataBadgeIncomplete),
                    }}
                  >
                    Data {dataBadgeLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={styles.identityRight}>
            <div style={styles.scorePanel}>
              <div style={styles.scoreValue}>{scoreLabel}</div>
              <div style={styles.scoreLabel}>GTIXT Composite Score</div>
            </div>
            <div style={styles.identityRightMeta}>
              <div>
                <div style={styles.label}>Confidence</div>
                <div style={styles.valueSmall}>{confidence}</div>
              </div>
              <div>
                <div style={styles.label}>Last Snapshot</div>
                <div style={styles.valueSmall} suppressHydrationWarning>
                  {snapshot?.timestamp || snapshot?.created_at
                    ? new Date(snapshot.timestamp || snapshot.created_at || "").toLocaleDateString()
                    : firm?.last_updated
                    ? new Date(firm.last_updated).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {dataMissingCount > 0 && (
          <section style={styles.dataGapBanner}>
            <div style={styles.dataGapTitle}>Data gaps detected</div>
            <div style={styles.dataGapMeta}>
              {dataMissingCount} missing field{dataMissingCount === 1 ? "" : "s"} in the latest snapshot.
            </div>
            <div style={styles.dataGapList}>{dataMissingDisplay}</div>
          </section>
        )}

        {/* 2) Executive Summary */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Executive Summary</h2>
          <p style={styles.summary}>{executiveSummary}</p>
        </section>

        {/* 2.5) FCA & Sanctions Verification */}
        <VerificationWidget 
          firmName={firm?.name || firm?.firm_name || ""}
          country={firm?.jurisdiction}
        />

        {/* 3) GTIXT Pillars Breakdown */}
        <section style={styles.pillarsSection}>
          <h2 style={styles.sectionTitle}>GTIXT Pillars Breakdown</h2>
          <div style={styles.pillarsGrid}>
            {PILLARS.map((pillar) => {
              const raw = getMetricValue(firm, pillar.sources) as number | undefined;
              const pillarScore = typeof raw === "number" ? (raw > 1 ? raw / 100 : raw) : 0;
              const labelValue = raw === undefined ? "—" : Math.round(pillarScore * 100).toString();
              return (
                <div key={pillar.key} style={{ ...styles.pillarCard, background: getPillarColor(pillarScore) }}>
                  <div style={styles.pillarIcon}>{pillar.icon}</div>
                  <h3 style={styles.pillarName}>{pillar.label}</h3>
                  <div style={styles.pillarScore}>{labelValue}</div>
                  <div style={styles.pillarBar}>
                    <div
                      style={{
                        ...styles.pillarBarFill,
                        width: `${pillarScore * 100}%`,
                        background: getScoreColor(pillarScore),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4) Metrics Detail Panel */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Metrics Detail Panel</h2>
          <p style={styles.sectionNote}>Missing values mean no verified data in the current snapshot.</p>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Metric</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {metricRows.map((row) => {
                  const displayText = row.display || MISSING_VALUE;
                  const valueStyle =
                    displayText === MISSING_VALUE
                      ? { ...styles.tdValue, ...styles.missingValue }
                      : styles.tdValue;
                  const status = getMetricStatus(row.key, row.value);
                  return (
                    <tr key={row.key}>
                      <td style={styles.tdLabel}>{row.label}</td>
                      <td style={valueStyle}>{displayText}</td>
                      <td style={styles.tdStatus}>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4.5) Firm Details Section */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Firm Details</h2>
          <p style={styles.sectionNote}>Displayed values come from the latest verified snapshot.</p>
          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <span style={styles.label}>Founded</span>
              <span style={detailValueStyle(foundedDisplay)}>{foundedDisplay}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Headquarters</span>
              <span style={detailValueStyle(jurisdiction)}>{jurisdiction}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Jurisdiction Tier</span>
              <span style={detailValueStyle(jurisdictionTier)}>{jurisdictionTier}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Model Type</span>
              <span style={detailValueStyle(modelType)}>{modelType}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Payout Frequency</span>
              <span style={detailValueStyle(payoutFrequency)}>{payoutFrequency}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Max Drawdown Rule</span>
              <span style={detailValueStyle(maxDrawdownRule)}>{maxDrawdownRule}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Daily Drawdown Rule</span>
              <span style={detailValueStyle(dailyDrawdownRule)}>{dailyDrawdownRule}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Rule Change Frequency</span>
              <span style={detailValueStyle(ruleChangesFrequency)}>
                {ruleChangesFrequency}
                {ruleChangesFrequencyRaw !== undefined &&
                  ruleChangesFrequencyRaw !== null &&
                  ruleChangesFrequencyRaw !== "" &&
                  ruleChangesFrequency !== MISSING_VALUE && (
                  <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>
                    {getMetricStatus("rule_changes_frequency", ruleChangesFrequencyRaw)}
                  </span>
                )}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>NA Rate</span>
              <span style={detailValueStyle(toDisplayPercent(naRate, 1))}>{toDisplayPercent(naRate, 1)}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Data Completeness</span>
              <span style={detailValueStyle(toDisplayPercent(dataCompleteness, 1))}>
                {toDisplayPercent(dataCompleteness, 1)}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Data Badge</span>
              <span style={detailValueStyle(dataBadgeLabel ? `Data ${dataBadgeLabel}` : MISSING_VALUE)}>
                {dataBadgeLabel ? `Data ${dataBadgeLabel}` : MISSING_VALUE}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Missing Fields</span>
              <span style={detailValueStyle(dataMissingCount ? `${dataMissingCount} fields` : "None")}>
                {dataMissingCount ? `${dataMissingCount} fields` : "None"}
              </span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Payout Reliability</span>
              <span style={detailValueStyle(payoutReliabilityDisplay)}>{payoutReliabilityDisplay}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Risk Model Integrity</span>
              <span style={detailValueStyle(riskModelIntegrityDisplay)}>{riskModelIntegrityDisplay}</span>
            </div>
            <div style={styles.detailItem}>
              <span style={styles.label}>Operational Stability</span>
              <span style={detailValueStyle(operationalStabilityDisplay)}>{operationalStabilityDisplay}</span>
            </div>
          </div>
        </section>

        {/* 4.7) Compliance Flags Section */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Compliance Flags</h2>
          <div style={styles.flagsContainer}>
            <div style={{...styles.flagGroup, ...styles.flagGreen}}>
              <h3 style={styles.flagTitle}>✓ Green Flags (Positive Indicators)</h3>
              <ul style={styles.flagList}>
                {oversightVerdict !== "NA" && oversightVerdict !== "—" && (
                  <li style={styles.flagItem}>Oversight gate verdict: {oversightVerdict}</li>
                )}
                {normalizedScore >= 0.8 && (
                  <li style={styles.flagItem}>Strong GTIXT composite score (≥0.8)</li>
                )}
                {confidence === "HIGH" && (
                  <li style={styles.flagItem}>High confidence assessment</li>
                )}
                {naRate !== undefined && naRate < 0.15 && (
                  <li style={styles.flagItem}>Good data completeness (NA rate &lt;15%)</li>
                )}
                {historicalConsistency === "stable" && (
                  <li style={styles.flagItem}>Stable historical performance</li>
                )}
              </ul>
            </div>

            <div style={{...styles.flagGroup, ...styles.flagAmber}}>
              <h3 style={styles.flagTitle}>⚠ Amber Flags (Review Required)</h3>
              <ul style={styles.flagList}>
                {normalizedScore < 0.8 && normalizedScore >= 0.6 && (
                  <li style={styles.flagItem}>Medium GTIXT score - review recommended</li>
                )}
                {confidence === "MEDIUM" && (
                  <li style={styles.flagItem}>Medium confidence - data gaps present</li>
                )}
                {naRate !== undefined && naRate >= 0.15 && naRate < 0.3 && (
                  <li style={styles.flagItem}>Moderate NA rate (15-30%)</li>
                )}
                {typeof ruleChangesFrequency === "string" && ruleChangesFrequency.toLowerCase().includes("high") && (
                  <li style={styles.flagItem}>High rule change frequency detected</li>
                )}
              </ul>
            </div>

            <div style={{...styles.flagGroup, ...styles.flagRed}}>
              <h3 style={styles.flagTitle}>✗ Red Flags (Requires Attention)</h3>
              <ul style={styles.flagList}>
                {normalizedScore < 0.6 && (
                  <li style={styles.flagItem}>Low GTIXT composite score (&lt;0.6)</li>
                )}
                {confidence === "LOW" && (
                  <li style={styles.flagItem}>Low confidence - insufficient data</li>
                )}
                {naRate !== undefined && naRate >= 0.3 && (
                  <li style={styles.flagItem}>High NA rate (≥30%) - data quality concerns</li>
                )}
                {oversightVerdict && oversightVerdict.toLowerCase().includes("fail") && (
                  <li style={styles.flagItem}>Oversight gate verdict: {oversightVerdict}</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Score Trajectory - New Institutional Component */}
        <ScoreTrajectory
          firmName={firmName}
          points={snapshotHistory
            .filter((h): h is { date: string; score: number; confidence?: string } => typeof (h as any).score === 'number')
            .map((h) => ({
              date: h.date ? new Date(h.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '—',
              score: Math.round(h.score ? (h.score > 1 ? h.score / 100 : h.score) * 100 : 0),
            }))}
          percentiles={{
            universe: percentileUniverse,
            modelType: percentileModelType,
            jurisdiction: percentileJurisdiction,
          }}
        />

        {/* 5) Snapshot History */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Snapshot History</h2>
          {snapshotHistory.length > 0 ? (
            <ul style={styles.timeline}>
              {snapshotHistory.map((item, idx) => (
                <li key={`${item.date}-${idx}`} style={styles.timelineItem}>
                  <div style={styles.timelineDate}>
                    {item.date ? new Date(item.date).toLocaleDateString() : "—"}
                  </div>
                  <div style={styles.timelineDetail}>
                    <div style={styles.timelineScore}>Score: {item.score ? toScore100(item.score) : scoreLabel}</div>
                    <div style={styles.timelineNote}>{item.note || "Snapshot recorded"}</div>
                    {item.confidence && <div style={styles.timelineConfidence}>Confidence: {formatConfidence(item.confidence)}</div>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={styles.emptyState}>Historical series will appear once multiple snapshots are available.</div>
          )}
        </section>

        {/* 6) Integrity & Audit Trail */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Integrity & Audit Trail</h2>
          <div style={styles.auditGrid}>
            <div>
              <div style={styles.label}>Snapshot ID</div>
              <div style={styles.valueSmall}>{snapshotId}</div>
            </div>
            <div>
              <div style={styles.label}>SHA-256 Hash</div>
              <div style={styles.hashCode}>{sha256Hash}</div>
            </div>
            <div>
              <div style={styles.label}>Oversight Gate verdict</div>
              <div style={styles.valueSmall}>{oversightVerdict}</div>
            </div>
            <div>
              <div style={styles.label}>NA policy applied</div>
              <div style={styles.valueSmall}>{naPolicy}</div>
            </div>
          </div>

          {firm?.data_sources && Array.isArray(firm.data_sources) && firm.data_sources.length > 0 && (
            <div style={styles.sourcesWrap}>
              <div style={styles.label}>Data sources</div>
              <ul style={styles.sourcesList}>
                {firm.data_sources.map((source, idx) => (
                  <li key={idx} style={styles.sourceItem}>
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.integrityActions}>
            {snapshot?.snapshot_uri && (
              <a href={snapshot.snapshot_uri} target="_blank" rel="noopener noreferrer" style={styles.actionBtn}>
                Download Raw JSON ↗
              </a>
            )}
            <Link href="/integrity" style={styles.actionBtn}>
              Verify Snapshot
            </Link>
            <Link href="/methodology" style={styles.actionBtn}>
              View Methodology
            </Link>
          </div>
        </section>

        {/* 7) GTIXT Interpretation Layer */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>GTIXT Interpretation Layer</h2>
          <p style={styles.summary}>{interpretation}</p>
        </section>

        {/* 8) Comparative Positioning */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Comparative Positioning</h2>
          <div style={styles.compareGrid}>
            <div style={styles.compareItem}>
              <div style={styles.label}>Percentile vs universe</div>
              <div style={styles.valueSmall}>
                {toDisplayPercent(percentileUniverse, 0)}
              </div>
            </div>
            <div style={styles.compareItem}>
              <div style={styles.label}>Percentile vs model type</div>
              <div style={styles.valueSmall}>
                {toDisplayPercent(percentileModelType, 0)}
              </div>
            </div>
            <div style={styles.compareItem}>
              <div style={styles.label}>Percentile vs jurisdiction</div>
              <div style={styles.valueSmall}>
                {toDisplayPercent(percentileJurisdiction, 0)}
              </div>
            </div>
          </div>
        </section>

        {/* 9) Future Evolution Roadmap */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Future Evolution (Institutional Roadmap)</h2>
          <div style={styles.futureGrid}>
            {FUTURE_INDICATORS.map((item) => (
              <div key={item.key} style={styles.futureCard}>
                <div style={styles.futureHeader}>
                  <div style={styles.futureTitle}>{item.title}</div>
                  <span style={item.status === "R&D" ? styles.futureTagRND : styles.futureTag}>
                    {item.status}
                  </span>
                </div>
                <div style={styles.futureDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 10) Agent Architecture */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Agent Architecture</h2>
          <div style={styles.agentGrid}>
            {AGENT_ARCHITECTURE.map((agent) => (
              <div key={agent.key} style={styles.agentCard}>
                <div style={styles.agentTitle}>{agent.title}</div>
                <div style={styles.agentDesc}>{agent.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Advanced Intelligence Layer (now standard) */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Advanced Intelligence Layer</h2>
          <div style={styles.futureGrid}>
            {PRO_FEATURES.map((item) => (
              <div key={item.key} style={styles.futureCard}>
                <div style={styles.futureHeader}>
                  <div style={styles.futureTitle}>{item.title}</div>
                  <span style={styles.futureTagAdvanced}>Advanced</span>
                </div>
                <div style={styles.futureDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 11) Disclosure & Disclaimer */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Disclosure & Disclaimer</h2>
          <p style={styles.description}>
            This profile is a standardized institutional record. It does not constitute advice, recommendation, or endorsement. All values are derived from
            publicly available sources, versioned snapshots, and auditable GTIXT methodology. Confidence levels express data completeness only.
          </p>
        </section>

        {/* Navigation */}
        <div style={styles.navFooter}>
          <Link href="/rankings" style={styles.backLink}>
            ← Back to Rankings
          </Link>
          <span style={styles.navDivider}>•</span>
          <Link href="/data" style={styles.backLink}>
            View All Data
          </Link>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  identityBlock: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: "2rem",
    marginBottom: "2.5rem",
    paddingBottom: "2rem",
    borderBottom: "1px solid rgba(0, 212, 194, 0.2)",
  },
  identityLeft: {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
    flex: 1,
  },
  logoWrap: {
    width: "72px",
    height: "72px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(0, 212, 194, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "grayscale(1) contrast(1.1)",
  },
  logoFallback: {
    color: "#00D4C2",
    fontWeight: 700,
    fontSize: "1.25rem",
    letterSpacing: "0.08em",
  },
  identityName: {
    fontSize: "2.25rem",
    color: "#D0D7DE",
    fontWeight: 700,
    marginBottom: "0.75rem",
  },
  identityMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  metaPill: {
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.8)",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  statusPill: {
    background: "rgba(0, 212, 194, 0.2)",
    color: "#00D4C2",
  },
  statusPillPass: {
    background: "rgba(16, 185, 129, 0.2)",
    color: "#10B981",
  },
  statusPillReview: {
    background: "rgba(245, 158, 11, 0.2)",
    color: "#F59E0B",
  },
  statusPillFail: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#EF4444",
  },
  dataBadgeComplete: {
    background: "rgba(16, 185, 129, 0.2)",
    color: "#10B981",
  },
  dataBadgePartial: {
    background: "rgba(245, 158, 11, 0.2)",
    color: "#F59E0B",
  },
  dataBadgeIncomplete: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#EF4444",
  },
  identityRight: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "1rem",
    minWidth: "240px",
  },
  scorePanel: {
    padding: "1.25rem 1.5rem",
    borderRadius: "12px",
    background: "rgba(0, 212, 194, 0.12)",
    border: "1px solid rgba(0, 212, 194, 0.3)",
    textAlign: "right",
  },
  identityRightMeta: {
    display: "grid",
    gap: "0.75rem",
    textAlign: "right",
  },
  loading: {
    padding: "3rem",
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: "0.875rem",
  },
  error: {
    padding: "2rem",
    background: "rgba(212, 69, 69, 0.1)",
    border: "1px solid rgba(212, 69, 69, 0.3)",
    borderRadius: "8px",
    color: "#D64545",
    marginBottom: "1rem",
  },
  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "3rem",
    paddingBottom: "2rem",
    borderBottom: "1px solid rgba(0, 212, 194, 0.2)",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: "flex",
    gap: "2rem",
    alignItems: "flex-end",
  },
  firmName: {
    fontSize: "2.5rem",
    color: "#D0D7DE",
    margin: "0 0 1rem 0",
    fontWeight: 700,
  },
  headerMeta: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  jurisdiction: {
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.7)",
  },
  badge: {
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#0A0F12",
    textTransform: "uppercase",
  },
  scoreChip: {
    textAlign: "center",
    padding: "1rem",
    background: "rgba(0, 212, 194, 0.1)",
    border: "1px solid rgba(0, 212, 194, 0.3)",
    borderRadius: "8px",
  },
  scoreValue: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#00D4C2",
  },
  scoreLabel: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.6)",
    marginTop: "0.25rem",
  },
  valueSmall: {
    fontSize: "0.95rem",
    color: "#D0D7DE",
    fontWeight: 600,
  },
  timestamp: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.5)",
  },
  summary: {
    fontSize: "1rem",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.6,
    maxWidth: "90ch",
  },
  pillarsSection: {
    marginBottom: "3rem",
  },
  sectionTitle: {
    fontSize: "1.75rem",
    color: "#00FFFF",
    marginBottom: "1.5rem",
    fontWeight: 800,
    paddingLeft: "1.5rem",
    paddingTop: "1rem",
    paddingBottom: "1rem",
    paddingRight: "1.5rem",
    borderLeft: "8px solid #00FFFF",
    background: "rgba(0, 255, 255, 0.25)",
    borderRadius: "0 8px 8px 0",
    boxShadow: "inset -30px 0 40px rgba(0, 255, 255, 0.15), 0 2px 8px rgba(0, 255, 255, 0.2)",
    textShadow: "0 0 10px rgba(0, 255, 255, 0.4)",
    letterSpacing: "0.5px",
  },
  sectionNote: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.65)",
    marginTop: "-0.5rem",
    marginBottom: "1.25rem",
  },
  pillarsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "1rem",
  },
  pillarCard: {
    padding: "1.5rem",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 194, 0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  pillarIcon: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
  },
  pillarName: {
    fontSize: "0.875rem",
    color: "#D0D7DE",
    margin: "0 0 0.75rem 0",
    fontWeight: 700,
  },
  pillarScore: {
    fontSize: "1.5rem",
    color: "#00D4C2",
    fontWeight: 700,
    marginBottom: "0.75rem",
  },
  pillarBar: {
    width: "100%",
    height: "4px",
    background: "rgba(0, 212, 194, 0.2)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  pillarBarFill: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
  },
  th: {
    textAlign: "left",
    padding: "0.75rem 0",
    borderBottom: "1px solid rgba(0, 212, 194, 0.2)",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "0.7rem",
  },
  tdLabel: {
    padding: "0.85rem 0",
    color: "#D0D7DE",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  tdValue: {
    padding: "0.85rem 0",
    color: "rgba(255,255,255,0.8)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  tdStatus: {
    padding: "0.85rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    color: "#00D4C2",
    fontWeight: 600,
  },
  timeline: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: "1rem",
  },
  timelineItem: {
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: "1.5rem",
    padding: "1rem",
    borderRadius: "10px",
    background: "rgba(10, 15, 18, 0.7)",
    border: "1px solid rgba(0, 212, 194, 0.15)",
  },
  timelineDate: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.6)",
    fontWeight: 600,
  },
  timelineDetail: {
    display: "grid",
    gap: "0.35rem",
  },
  timelineScore: {
    fontSize: "0.95rem",
    color: "#D0D7DE",
    fontWeight: 600,
  },
  timelineNote: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.7)",
  },
  timelineConfidence: {
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.6)",
  },
  emptyState: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.6)",
  },
  auditGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  sourcesWrap: {
    marginBottom: "1.5rem",
  },
  compareGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  compareItem: {
    padding: "1rem",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(0, 212, 194, 0.15)",
  },
  futureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.25rem",
  },
  futureCard: {
    padding: "1.25rem",
    borderRadius: "12px",
    background: "rgba(10, 15, 18, 0.7)",
    border: "1px solid rgba(0, 212, 194, 0.18)",
    display: "grid",
    gap: "0.75rem",
  },
  futureHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.75rem",
  },
  futureTitle: {
    fontSize: "0.95rem",
    color: "#D0D7DE",
    fontWeight: 700,
  },
  futureDesc: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.5,
  },
  futureTag: {
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(0, 212, 194, 0.2)",
    color: "#00D4C2",
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  futureTagAdvanced: {
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(100, 150, 255, 0.2)",
    color: "#A0C0FF",
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  futureTagRND: {
    padding: "0.25rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(255,165,0,0.2)",
    color: "#FFD08A",
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  agentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1.25rem",
  },
  agentCard: {
    padding: "1.5rem",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(0, 212, 194, 0.15)",
    display: "grid",
    gap: "0.75rem",
  },
  agentTitle: {
    fontSize: "1rem",
    color: "#D0D7DE",
    fontWeight: 700,
  },
  agentDesc: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.5,
  },
  dataGapBanner: {
    padding: "1.5rem 2rem",
    borderRadius: "12px",
    border: "1px solid rgba(245, 158, 11, 0.35)",
    background: "rgba(245, 158, 11, 0.12)",
    marginBottom: "2rem",
  },
  dataGapTitle: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "#F59E0B",
    marginBottom: "0.35rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  dataGapMeta: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.8)",
    marginBottom: "0.5rem",
  },
  dataGapList: {
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.5,
  },
  card: {
    padding: "2rem",
    background: "rgba(0, 212, 194, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 212, 194, 0.2)",
    marginBottom: "2rem",
  },
  confidenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1.5rem",
  },
  confidenceItem: {
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(0, 212, 194, 0.1)",
  },
  label: {
    fontSize: "0.75rem",
    color: "#00D4C2",
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: "0.5rem",
  },
  value: {
    fontSize: "1.25rem",
    color: "#D0D7DE",
    fontWeight: 700,
  },
  integrityContent: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  hashBox: {
    padding: "1rem",
    background: "#0A0F12",
    borderRadius: "8px",
    border: "1px solid #00D4C2",
  },
  hashCode: {
    display: "block",
    color: "#00D4C2",
    fontSize: "0.75rem",
    wordBreak: "break-all",
    fontFamily: "monospace",
    marginTop: "0.5rem",
  },
  integrityActions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  actionBtn: {
    padding: "0.75rem 1rem",
    background: "#00D4C2",
    color: "#0A0F12",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s",
  },
  sourcesList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  sourceItem: {
    padding: "0.75rem 0",
    borderBottom: "1px solid rgba(0, 212, 194, 0.1)",
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.8)",
  },
  description: {
    fontSize: "0.875rem",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  link: {
    color: "#00D4C2",
    textDecoration: "none",
    borderBottom: "1px solid #00D4C2",
    fontSize: "0.875rem",
    fontWeight: 700,
  },
  navFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "3rem",
    paddingTop: "2rem",
    borderTop: "1px solid rgba(0, 212, 194, 0.2)",
  },
  backLink: {
    color: "#00D4C2",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 700,
  },
  navDivider: {
    color: "rgba(255,255,255,0.3)",
  },
  // Firm Details styles
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1rem",
    background: "rgba(0, 212, 194, 0.05)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 194, 0.15)",
  },
  detailValue: {
    fontSize: "1rem",
    color: "#D0D7DE",
    fontWeight: "600",
  },
  missingValue: {
    color: "rgba(255,255,255,0.55)",
    fontStyle: "italic",
  },
  // Compliance Flags styles
  flagsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
  },
  flagGroup: {
    padding: "1.5rem",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  flagGreen: {
    background: "rgba(63, 185, 80, 0.08)",
    borderColor: "#3FB950",
  },
  flagAmber: {
    background: "rgba(240, 165, 0, 0.08)",
    borderColor: "#F0A500",
  },
  flagRed: {
    background: "rgba(212, 69, 69, 0.08)",
    borderColor: "#D64545",
  },
  flagTitle: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "#D0D7DE",
    marginBottom: "1rem",
  },
  flagList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  flagItem: {
    fontSize: "0.85rem",
    color: "#8B949E",
    padding: "0.5rem 0",
    lineHeight: "1.5",
  },
  // Score Trajectory styles
  trajectoryInterpretation: {
    marginBottom: "1.5rem",
    padding: "1rem",
    background: "rgba(0, 212, 194, 0.08)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 194, 0.15)",
  },
  trajectoryText: {
    fontSize: "0.95rem",
    color: "#D0D7DE",
    margin: 0,
    lineHeight: "1.6",
  },
  trajectoryChartContainer: {
    marginBottom: "2rem",
    padding: "1rem",
    background: "rgba(0, 212, 194, 0.03)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 194, 0.1)",
    overflow: "auto",
  },
  trajectoryChart: {
    width: "100%",
    height: "auto",
    minHeight: "300px",
  },
  // Historical Evolution styles
  evolutionContainer: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem",
  },
  evolutionChart: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  chartLabel: {
    fontSize: "0.875rem",
    color: "#00D4C2",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sparkline: {
    display: "flex",
    alignItems: "flex-end",
    gap: "2px",
    height: "120px",
    padding: "1rem",
    background: "rgba(0, 212, 194, 0.05)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 194, 0.15)",
  },
  sparklineBar: {
    flex: "1 1 auto",
    minWidth: "8px",
    borderRadius: "2px 2px 0 0",
    transition: "all 0.2s",
  },
  emptyChart: {
    fontSize: "0.875rem",
    color: "#8B949E",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  evolutionStats: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1rem",
    background: "rgba(0, 212, 194, 0.05)",
    borderRadius: "8px",
    border: "1px solid rgba(0, 212, 194, 0.15)",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#00D4C2",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "1.25rem",
    color: "#D0D7DE",
    fontWeight: "700",
  },
};

