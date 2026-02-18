import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { rateLimit } from "../../lib/rateLimit";
import { fetchJsonWithFallback, parseFallbackRoots } from "../../lib/fetchWithFallback";
import { logEvent } from "../../lib/logEvent";
import { alertMinIOFailure } from "../../lib/alerting";

interface FirmRecord {
  firm_id?: string;
  firm_name?: string;
  name?: string;
  [key: string]: unknown;
}

interface LatestSnapshot {
  object?: string;
  sha256?: string;
  created_at?: string;
  count?: number;
  snapshot_key?: string;
}

interface ApiResponse {
  firm?: FirmRecord;
  snapshot?: LatestSnapshot;
  error?: string;
}

let pool: Pool | null = null;
let overridesCache: Record<string, FirmRecord> | null = null;
const firmCache = new Map<string, { expiresAt: number; payload: ApiResponse }>();

const readOverridesFile = (fileName: string): Record<string, FirmRecord> => {
  try {
    const filePath = path.join(process.cwd(), "data", fileName);
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, FirmRecord>;
    const cleaned: Record<string, FirmRecord> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (key.startsWith("_")) continue;
      cleaned[key.toLowerCase()] = value;
    }
    return cleaned;
  } catch {
    return {};
  }
};

const loadOverrides = (): Record<string, FirmRecord> => {
  if (overridesCache) return overridesCache;
  const autoOverrides = readOverridesFile("firm-overrides.auto.json");
  const manualOverrides = readOverridesFile("firm-overrides.json");
  overridesCache = { ...autoOverrides, ...manualOverrides };
  return overridesCache;
};

const applyOverrides = (record: FirmRecord, overrides: Record<string, FirmRecord>): FirmRecord => {
  const firmId = (record.firm_id || "").toLowerCase();
  if (!firmId) return record;
  const override = overrides[firmId];
  if (!override) return record;
  const merged: FirmRecord = { ...record };
  for (const [key, value] of Object.entries(override)) {
    if (!isEmptyValue(value)) {
      merged[key] = value;
    }
  }
  return merged;
};
const getDatabaseUrl = (): string | null => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.password) return null;
  } catch (error) {
    return null;
  }
  return url;
};

const getPool = (): Pool | null => {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
};

const normalizeName = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isEmptyValue = (value: unknown): boolean =>
  value === undefined || value === null || value === "";

const parseNumeric = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.replace(/%/g, "");
    const numeric = Number(normalized);
    return Number.isNaN(numeric) ? undefined : numeric;
  }
  return undefined;
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

const sanitizeDrawdown = (value: number | undefined, options: { maxAllowed: number }): number | undefined => {
  const { maxAllowed } = options;
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;
  if (value <= 0 || value > maxAllowed) return undefined;
  return value;
};

const unwrapDatapointValue = (value: unknown): Record<string, any> => {
  if (value && typeof value === "object") {
    const obj = value as Record<string, any>;
    if (obj.rules && typeof obj.rules === "object") {
      return obj.rules;
    }
    if (obj.value && typeof obj.value === "object") {
      return obj.value;
    }
    return obj;
  }
  return {};
};

const inferJurisdictionTier = (jurisdiction?: string): string | undefined => {
  if (!jurisdiction) return undefined;
  const value = jurisdiction.toLowerCase();
  const tierOne = [
    "united states",
    "usa",
    "canada",
    "united kingdom",
    "uk",
    "australia",
    "new zealand",
    "singapore",
    "japan",
    "germany",
    "france",
    "netherlands",
    "switzerland",
    "austria",
    "sweden",
    "norway",
    "denmark",
    "finland",
    "ireland",
  ];
  if (tierOne.some((country) => value.includes(country))) {
    return "Tier 1";
  }
  if (value.includes("eu") || value.includes("europe")) {
    return "Tier 2";
  }
  if (value.includes("offshore") || value.includes("islands")) {
    return "Tier 3";
  }
  return "Tier 2";
};

const pickFirstValue = <T,>(...values: Array<T | null | undefined | "">): T | undefined => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value as T;
    }
  }
  return undefined;
};

const pickMetricScore = (metricScores: Record<string, any> | null | undefined, keys: string[]): number | undefined => {
  if (!metricScores) return undefined;
  for (const key of keys) {
    const value = metricScores[key];
    const parsed = parseNumeric(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

const ensureHeadquarters = (record: FirmRecord): FirmRecord => {
  if (!isEmptyValue(record.headquarters)) return record;
  if (!isEmptyValue(record.jurisdiction)) {
    return { ...record, headquarters: record.jurisdiction };
  }
  return record;
};

const resolveJurisdiction = (record: FirmRecord): string | undefined => {
  const raw = typeof record.jurisdiction === "string" ? record.jurisdiction.trim() : "";
  if (raw && raw.length <= 40) return raw;
  const inferred =
    inferJurisdictionFromUrl(record.website_root as string | undefined) ||
    inferJurisdictionFromUrl(record.website as string | undefined);
  if (inferred) return inferred;
  const headquarters = typeof record.headquarters === "string" ? record.headquarters.trim() : "";
  if (headquarters && headquarters.length <= 40) return headquarters;
  const site = (record.website_root || record.website || "") as string;
  if (site && /\.(com|net|org|co)(\/|$)/i.test(site)) {
    return "Global";
  }
  return undefined;
};

const applyDerivedFields = (record: FirmRecord): FirmRecord => {
  const inferredJurisdiction = resolveJurisdiction(record) || record.jurisdiction;
  const normalizedNaRate = parseNumeric(record.na_rate);
  const normalizedDataCompleteness = parseNumeric(record.data_completeness);
  const normalizedDataCompletenessRatio =
    normalizedDataCompleteness !== undefined
      ? normalizedDataCompleteness > 1
        ? normalizedDataCompleteness / 100
        : normalizedDataCompleteness
      : undefined;
  let resolvedJurisdictionTier =
    record.jurisdiction_tier || inferJurisdictionTier(inferredJurisdiction as string | undefined);
  if (!resolvedJurisdictionTier && inferredJurisdiction === "Global") {
    resolvedJurisdictionTier = "Global";
  }

  const metricScores = record.metric_scores as Record<string, any> | undefined;
  const pillarScores = record.pillar_scores as Record<string, any> | undefined;

  const payoutReliability = pickFirstValue(
    record.payout_reliability as number | undefined,
    pickPillarScore(pillarScores, ["payout"]),
    pickMetricScore(metricScores, ["payout_reliability", "payout.reliability"])
  );

  const riskModelIntegrity = pickFirstValue(
    record.risk_model_integrity as number | undefined,
    pickPillarScore(pillarScores, ["risk"]),
    pickMetricScore(metricScores, ["risk_model_integrity", "risk.model_integrity"])
  );

  const operationalStability = pickFirstValue(
    record.operational_stability as number | undefined,
    pickPillarScore(pillarScores, ["operational", "stability"]),
    pickMetricScore(metricScores, ["operational_stability", "operational.stability"])
  );

  const historicalConsistency = pickFirstValue(
    record.historical_consistency as number | undefined,
    pickPillarScore(pillarScores, ["historical", "consistency"]),
    pickMetricScore(metricScores, ["historical_consistency", "historical.consistency"])
  );

  const naPolicyApplied =
    record.na_policy_applied !== undefined
      ? record.na_policy_applied
      : normalizedNaRate !== undefined && normalizedNaRate !== null;

  const completenessKeys = [
    "payout_frequency",
    "max_drawdown_rule",
    "daily_drawdown_rule",
    "rule_changes_frequency",
    "jurisdiction",
    "jurisdiction_tier",
    "headquarters",
    "founded_year",
  ];
  const missingFields: string[] = [];
  const presentCount = completenessKeys.reduce((count, key) => {
    const value = (record as Record<string, unknown>)[key];
    if (value === undefined || value === null || value === "") {
      missingFields.push(key);
      return count;
    }
    if (Array.isArray(value) && value.length === 0) {
      missingFields.push(key);
      return count;
    }
    return count + 1;
  }, 0);
  const computedCompleteness = completenessKeys.length
    ? Math.round((presentCount / completenessKeys.length) * 1000) / 1000
    : undefined;
  const resolvedCompleteness =
    normalizedDataCompletenessRatio !== undefined ? normalizedDataCompletenessRatio : computedCompleteness;
  const resolvedBadge =
    typeof record.data_badge === "string" && record.data_badge
      ? record.data_badge
      : resolvedCompleteness !== undefined
      ? resolvedCompleteness >= 0.75
        ? "complete"
        : resolvedCompleteness >= 0.45
        ? "partial"
        : "incomplete"
      : undefined;

  return ensureHeadquarters({
    ...record,
    jurisdiction: inferredJurisdiction || record.jurisdiction,
    payout_reliability: payoutReliability,
    risk_model_integrity: riskModelIntegrity,
    operational_stability: operationalStability,
    historical_consistency: historicalConsistency,
    jurisdiction_tier:
      resolvedJurisdictionTier,
    na_policy_applied: naPolicyApplied,
    na_rate: normalizedNaRate !== undefined ? normalizedNaRate : record.na_rate,
    data_completeness: resolvedCompleteness,
    data_badge: resolvedBadge,
    data_missing_fields: missingFields,
    data_missing_count: missingFields.length,
  });
};

const computePercentile = (scores: number[], value: number): number | undefined => {
  if (!scores.length) return undefined;
  const sorted = [...scores].sort((a, b) => a - b);
  const rank = sorted.filter((score) => score <= value).length;
  if (sorted.length === 1) return 50;
  const pr = (rank - 1) / (sorted.length - 1);
  return Math.round((1 - pr) * 100);
};

const applySnapshotPercentiles = (records: FirmRecord[], record: FirmRecord): FirmRecord => {
  if (!records.length) return record;
  const scoreValue = parseNumeric(record.score_0_100 ?? record.score);
  if (scoreValue === undefined) return record;

  const universeScores = records
    .map((row) => parseNumeric(row.score_0_100 ?? row.score))
    .filter((value): value is number => value !== undefined);

  const modelType = (record.model_type as string | undefined) || "";
  const modelScores = records
    .filter((row) => (row.model_type as string | undefined) === modelType)
    .map((row) => parseNumeric(row.score_0_100 ?? row.score))
    .filter((value): value is number => value !== undefined);

  const jurisdiction = (record.jurisdiction as string | undefined) || "";
  const jurisdictionScores = records
    .filter((row) => (row.jurisdiction as string | undefined) === jurisdiction)
    .map((row) => parseNumeric(row.score_0_100 ?? row.score))
    .filter((value): value is number => value !== undefined);

  return {
    ...record,
    percentile_vs_universe:
      record.percentile_vs_universe !== undefined
        ? record.percentile_vs_universe
        : computePercentile(universeScores, scoreValue),
    percentile_vs_model_type:
      record.percentile_vs_model_type !== undefined
        ? record.percentile_vs_model_type
        : computePercentile(modelScores, scoreValue),
    percentile_vs_jurisdiction:
      record.percentile_vs_jurisdiction !== undefined
        ? record.percentile_vs_jurisdiction
        : computePercentile(jurisdictionScores, scoreValue),
  };
};

const minioEndpoint = (() => {
  const internal = process.env.MINIO_INTERNAL_ENDPOINT;
  if (internal) {
    return internal.replace(/\/+$/, "");
  }
  const root = process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT;
  if (root) {
    return root.replace(/\/+$/, "").replace(/\/gpti-snapshots$/, "");
  }
  return process.env.NEXT_PUBLIC_MINIO_PUBLIC_ENDPOINT || "http://localhost:9002";
})();

const buildRawUrl = (rawObjectPath?: string | null): string | null => {
  if (!rawObjectPath) return null;
  if (rawObjectPath.startsWith("http://") || rawObjectPath.startsWith("https://")) {
    return rawObjectPath;
  }
  const cleaned = rawObjectPath.replace(/^\/+/, "");
  return `${minioEndpoint}/${cleaned}`;
};

const regexPickFrequency = (text: string): string | undefined => {
  const lowered = text.toLowerCase();
  if (!lowered.includes("payout") && !lowered.includes("withdraw")) return undefined;
  const explicitPattern = /(on[-\s]?demand|daily|weekly|bi[-\s]?weekly|monthly|quarterly|annually|yearly)/i;
  const explicitMatch = lowered.match(explicitPattern);
  if (explicitMatch) {
    return explicitMatch[1].replace(/\s+/g, "_");
  }

  const intervalPattern = /payouts?\s+(?:are\s+)?(?:processed|paid|available)\s+(?:every|within)\s+(\d+)\s+days?/i;
  const intervalMatch = lowered.match(intervalPattern);
  if (intervalMatch) {
    const days = Number(intervalMatch[1]);
    if (!Number.isNaN(days)) {
      if (days <= 1) return "daily";
      if (days <= 7) return "weekly";
      if (days <= 14) return "biweekly";
      if (days <= 31) return "monthly";
    }
  }

  const windowPattern = /payouts?\s+(?:available|processed)\s+after\s+(\d+)\s+days?/i;
  const windowMatch = lowered.match(windowPattern);
  if (windowMatch) {
    const days = Number(windowMatch[1]);
    if (!Number.isNaN(days)) {
      if (days <= 7) return "weekly";
      if (days <= 14) return "biweekly";
      if (days <= 31) return "monthly";
    }
  }
  return undefined;
};

const regexPickPercent = (text: string, label: string): number | undefined => {
  const pattern = new RegExp(`${label}[^0-9]{0,50}(\\d{1,2}(?:\\.\\d{1,2})?)\\s*%`, "i");
  const match = text.match(pattern);
  if (!match) return undefined;
  const parsed = parseNumeric(match[1]);
  return parsed !== undefined ? parsed : undefined;
};

const regexPickRuleChange = (text: string): string | undefined => {
  const pattern = /rules? (change|update)[^\n]{0,40}(daily|weekly|monthly|quarterly|annually|yearly)/i;
  const match = text.match(pattern);
  if (!match) return undefined;
  return match[2].toLowerCase();
};

const extractRedirectTarget = (text: string): string | undefined => {
  const jsMatch = text.match(/window\.location(?:\.href)?\s*=\s*['\"]([^'\"]+)['\"]/i);
  if (jsMatch?.[1]) return jsMatch[1];
  const metaMatch = text.match(/url=([^;"']+)/i);
  if (metaMatch?.[1]) return metaMatch[1].trim().replace(/['"]/g, "");
  return undefined;
};

const EVIDENCE_EXTRACT_TIMEOUT_MS = Math.max(
  1500,
  Math.min(parseInt(process.env.NEXT_PUBLIC_FIRM_EVIDENCE_TIMEOUT_MS || "2500", 10) || 2500, 8000)
);

const tryExtractFromEvidence = async (rawObjectPath?: string | null) => {
  const url = buildRawUrl(rawObjectPath);
  if (!url) return {};
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(EVIDENCE_EXTRACT_TIMEOUT_MS) });
    if (!res.ok) return {};
    const text = (await res.text()).slice(0, 200000);
    const maxDrawdown =
      regexPickPercent(text, "max drawdown") ||
      regexPickPercent(text, "maximum drawdown") ||
      regexPickPercent(text, "max loss") ||
      regexPickPercent(text, "maximum loss") ||
      regexPickPercent(text, "loss limit");
    const dailyDrawdown =
      regexPickPercent(text, "daily drawdown") ||
      regexPickPercent(text, "daily loss") ||
      regexPickPercent(text, "loss limit per day");

    return {
      payout_frequency: regexPickFrequency(text),
      max_drawdown_rule: maxDrawdown,
      daily_drawdown_rule: dailyDrawdown,
      rule_changes_frequency: regexPickRuleChange(text),
    };
  } catch {
    return {};
  }
};

const tryExtractFromSourceUrl = async (sourceUrl?: string | null) => {
  if (!sourceUrl) return {};
  try {
    const res = await fetch(sourceUrl, { cache: "no-store", signal: AbortSignal.timeout(EVIDENCE_EXTRACT_TIMEOUT_MS) });
    if (!res.ok) return {};
    let text = (await res.text()).slice(0, 200000);
    const redirectTarget = extractRedirectTarget(text);
    if (redirectTarget) {
      try {
        const resolved = new URL(redirectTarget, sourceUrl).toString();
        const follow = await fetch(resolved, { cache: "no-store", signal: AbortSignal.timeout(EVIDENCE_EXTRACT_TIMEOUT_MS) });
        if (follow.ok) {
          text = (await follow.text()).slice(0, 200000);
        }
      } catch {
        // ignore redirect failures and proceed with base text
      }
    }
    const maxDrawdown =
      regexPickPercent(text, "max drawdown") ||
      regexPickPercent(text, "maximum drawdown") ||
      regexPickPercent(text, "max loss") ||
      regexPickPercent(text, "maximum loss") ||
      regexPickPercent(text, "loss limit");
    const dailyDrawdown =
      regexPickPercent(text, "daily drawdown") ||
      regexPickPercent(text, "daily loss") ||
      regexPickPercent(text, "loss limit per day");

    return {
      payout_frequency: regexPickFrequency(text),
      max_drawdown_rule: maxDrawdown,
      daily_drawdown_rule: dailyDrawdown,
      rule_changes_frequency: regexPickRuleChange(text),
    };
  } catch {
    return {};
  }
};

const pickPillarScore = (pillarScores: Record<string, any> | null | undefined, patterns: string[]): number | undefined => {
  if (!pillarScores) return undefined;
  const entries = Object.entries(pillarScores);
  for (const pattern of patterns) {
    const match = entries.find(([key]) => key.toLowerCase().includes(pattern));
    if (match) {
      const parsed = parseNumeric(match[1]);
      if (parsed !== undefined) return parsed;
    }
  }
  return undefined;
};

const mergeMissingFields = (base: FirmRecord, extra?: FirmRecord | null): FirmRecord => {
  if (!extra) return base;
  const merged: FirmRecord = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isEmptyValue(merged[key]) && !isEmptyValue(value)) {
      merged[key] = value;
    }
  }
  return merged;
};

const findSnapshotMatch = (
  records: FirmRecord[] | undefined,
  queryValue: string,
  firmRecord?: FirmRecord
): FirmRecord | null => {
  if (!records || !queryValue) return null;
  const query = queryValue.toLowerCase();

  const candidateNames = new Set<string>();
  const pushName = (value?: unknown) => {
    if (!value) return;
    candidateNames.add(normalizeName(String(value)));
  };

  pushName(query);
  if (firmRecord) {
    pushName(firmRecord.firm_name);
    pushName(firmRecord.name);
    pushName((firmRecord as any).brand_name);
  }

  const directMatch = records.find((record) =>
    (record.firm_id || "").toLowerCase() === query
  );
  if (directMatch) return directMatch;

  const nameMatch = records.find((record) =>
    candidateNames.has(
      normalizeName(String(record.firm_name || record.name || ""))
    )
  );
  return nameMatch || null;
};

const DEFAULT_LATEST_URL =
  process.env.SNAPSHOT_LATEST_URL ||
  process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
  "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json";

const DEFAULT_BUCKET_BASE =
  process.env.MINIO_INTERNAL_ROOT ||
  process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT ||
  "https://data.gtixt.com/gpti-snapshots/";

const FALLBACK_POINTER_URLS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_LATEST_POINTER_FALLBACKS
);

const FALLBACK_MINIO_ROOTS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_MINIO_FALLBACK_ROOTS
);

const ENRICHED_FIELDS = [
  "payout_reliability",
  "risk_model_integrity",
  "operational_stability",
  "historical_consistency",
  "snapshot_id",
  "na_policy_applied",
  "percentile_vs_universe",
  "percentile_vs_model_type",
  "percentile_vs_jurisdiction",
  "na_rate",
  "confidence",
  "pillar_scores",
  "metric_scores",
  "payout_frequency",
  "max_drawdown_rule",
  "daily_drawdown_rule",
  "rule_changes_frequency",
  "jurisdiction",
  "jurisdiction_tier",
  "website_root",
  "model_type",
  "status",
  "logo_url",
  "founded_year",
];

const hasMissingEnrichedFields = (record: FirmRecord): boolean =>
  ENRICHED_FIELDS.some((field) => isEmptyValue(record[field]));

const EVIDENCE_LIMIT = Math.max(
  10,
  Math.min(parseInt(process.env.NEXT_PUBLIC_FIRM_EVIDENCE_LIMIT || "60", 10) || 60, 200)
);
const EVIDENCE_PER_KEY = Math.max(
  2,
  Math.min(parseInt(process.env.NEXT_PUBLIC_FIRM_EVIDENCE_PER_KEY || "6", 10) || 6, 20)
);
const DISABLE_EVIDENCE_EXTRACT =
  process.env.NEXT_PUBLIC_DISABLE_EVIDENCE_EXTRACT === "1" ||
  process.env.DISABLE_EVIDENCE_EXTRACT === "1";
const FIRM_CACHE_TTL_MS = Math.max(
  0,
  Math.min(parseInt(process.env.NEXT_PUBLIC_FIRM_CACHE_TTL_MS || "60000", 10) || 60000, 10 * 60 * 1000)
);

type EvidenceRow = {
  key?: string | null;
  raw_object_path?: string | null;
  source_url?: string | null;
};

const selectEvidenceCandidates = (rows: EvidenceRow[], key: string): EvidenceRow[] =>
  rows.filter((row) => row.key === key).slice(0, EVIDENCE_PER_KEY);

const extractEvidenceData = async (rows: EvidenceRow[]) => {
  if (DISABLE_EVIDENCE_EXTRACT) return {};
  const merged: Record<string, any> = {};
  const deadline = Date.now() + EVIDENCE_EXTRACT_TIMEOUT_MS;
  for (const row of rows) {
    if (Date.now() > deadline) break;
    const data = await tryExtractFromEvidence(row.raw_object_path);
    for (const [key, value] of Object.entries(data)) {
      if (!isEmptyValue(value) && isEmptyValue(merged[key])) {
        merged[key] = value;
      }
    }
  }
  for (const row of rows) {
    if (Date.now() > deadline) break;
    const data = await tryExtractFromSourceUrl(row.source_url);
    for (const [key, value] of Object.entries(data)) {
      if (!isEmptyValue(value) && isEmptyValue(merged[key])) {
        merged[key] = value;
      }
    }
  }
  return merged;
};

async function loadRemoteSnapshot(): Promise<{ records: FirmRecord[]; metadata?: LatestSnapshot } | null> {
  try {
    const latestUrl = (process.env.NEXT_PUBLIC_SNAPSHOT_LATEST_URL || DEFAULT_LATEST_URL).trim();
    const bucketBase = (process.env.NEXT_PUBLIC_MINIO_BUCKET_BASE_URL || DEFAULT_BUCKET_BASE).trim();
    const pointerUrls = [latestUrl, ...FALLBACK_POINTER_URLS];

    const { data: latest, url: pointerUrl } = await fetchJsonWithFallback<LatestSnapshot>(pointerUrls, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const roots = [bucketBase, ...FALLBACK_MINIO_ROOTS];
    const snapshotUrlCandidates = latest.object
      ? roots.map((root) => `${root.replace(/\/+$/, "")}/${latest.object!.replace(/^\/+/, "")}`)
      : [];

    if (!snapshotUrlCandidates.length) {
      return null;
    }

    const { data: snapshotData, url: snapshotUrl } = await fetchJsonWithFallback<any>(snapshotUrlCandidates, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    logEvent("info", "firm.snapshot.remote", { pointerUrl, snapshotUrl });
    const records = Array.isArray(snapshotData)
      ? snapshotData
      : Array.isArray(snapshotData?.records)
      ? snapshotData.records
      : [];

    return { records, metadata: latest };
  } catch (err) {
    console.error('[API] Remote snapshot lookup failed:', err);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 120, keyPrefix: "firm" })) {
    return;
  }

  const cacheKey = `firm:${req.url || ""}`;
  if (req.method === "GET" && FIRM_CACHE_TTL_MS > 0) {
    const cached = firmCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json(cached.payload);
    }
  }

  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
  const { id, name, firmId } = req.query;
  const queryValue = (Array.isArray(id) ? id[0] : id) || (Array.isArray(firmId) ? firmId[0] : firmId) || (Array.isArray(name) ? name[0] : name);

  if (!queryValue) {
    return res.status(400).json({ error: "Missing id or name parameter" });
  }

  const requestStart = Date.now();
  try {
    let rows: FirmRecord[] = [];
    let snapshotMetadata: LatestSnapshot = {};
    let remoteSnapshotRecords: FirmRecord[] | null = null;

    const dbPool = getPool();
    if (dbPool) {
      try {
        const dbStart = Date.now();
        const latestSnapshotResult = await dbPool.query(
          `SELECT id, snapshot_key, object, sha256, created_at
           FROM snapshot_metadata
           WHERE snapshot_key <> $1
           ORDER BY created_at DESC
           LIMIT 1`,
          ["universe_v0.1_public"]
        );

        const latestSnapshot = latestSnapshotResult.rows[0];
        if (latestSnapshot) {
          snapshotMetadata = {
            object: latestSnapshot.object,
            sha256: latestSnapshot.sha256,
            created_at: latestSnapshot.created_at,
            snapshot_key: latestSnapshot.snapshot_key,
          };
        }

        const firmResult = await dbPool.query(
          `SELECT
             f.*,
             fp.executive_summary,
             fp.data_sources,
             fp.audit_verdict as profile_audit_verdict,
             fp.oversight_gate_verdict,
             fp.verification_hash,
             fp.last_updated,
             fe.founded_year as enriched_founded_year,
             fe.founded as enriched_founded,
             fe.headquarters as enriched_headquarters,
             fe.jurisdiction_tier as enriched_jurisdiction_tier,
             fe.rule_changes_frequency as enriched_rule_changes_frequency,
             fe.historical_consistency as enriched_historical_consistency,
             ss.score_0_100,
             ss.confidence,
             ss.na_rate,
             ss.pillar_scores,
             ss.metric_scores
           FROM firms f
           LEFT JOIN firm_profiles fp ON f.firm_id = fp.firm_id
           LEFT JOIN firm_enrichment fe ON f.firm_id = fe.firm_id
           LEFT JOIN snapshot_scores ss ON f.firm_id = ss.firm_id
             AND ss.snapshot_id = $2
           WHERE f.firm_id = $1
              OR lower(f.name) = lower($1)
              OR lower(f.brand_name) = lower($1)
           LIMIT 1`,
          [queryValue, latestSnapshot?.id || null]
        );
        logEvent("info", "firm.db.lookup", { duration_ms: Date.now() - dbStart });

        let percentileStats: {
          overall?: number;
          modelType?: number;
          jurisdiction?: number;
        } = {};

        if (latestSnapshot?.id && firmResult.rows[0]?.firm_id) {
          const firmId = firmResult.rows[0].firm_id;
          const overallResult = await dbPool.query(
            `WITH ranked AS (
               SELECT firm_id,
                      percent_rank() OVER (ORDER BY score_0_100 ASC) AS pr
               FROM snapshot_scores
               WHERE snapshot_id = $1
                 AND score_0_100 IS NOT NULL
             )
             SELECT pr FROM ranked WHERE firm_id = $2`,
            [latestSnapshot.id, firmId]
          );

          const modelResult = await dbPool.query(
            `WITH ranked AS (
               SELECT s.firm_id,
                      percent_rank() OVER (PARTITION BY f.model_type ORDER BY s.score_0_100 ASC) AS pr
               FROM snapshot_scores s
               JOIN firms f ON f.firm_id = s.firm_id
               WHERE s.snapshot_id = $1
                 AND s.score_0_100 IS NOT NULL
             )
             SELECT pr FROM ranked WHERE firm_id = $2`,
            [latestSnapshot.id, firmId]
          );

          const jurisdictionResult = await dbPool.query(
            `WITH ranked AS (
               SELECT s.firm_id,
                      percent_rank() OVER (PARTITION BY f.jurisdiction ORDER BY s.score_0_100 ASC) AS pr
               FROM snapshot_scores s
               JOIN firms f ON f.firm_id = s.firm_id
               WHERE s.snapshot_id = $1
                 AND s.score_0_100 IS NOT NULL
             )
             SELECT pr FROM ranked WHERE firm_id = $2`,
            [latestSnapshot.id, firmId]
          );

          const overall = overallResult.rows[0]?.pr;
          const modelType = modelResult.rows[0]?.pr;
          const jurisdiction = jurisdictionResult.rows[0]?.pr;

          percentileStats = {
            overall: overall !== undefined && overall !== null ? Math.round((1 - Number(overall)) * 100) : undefined,
            modelType: modelType !== undefined && modelType !== null ? Math.round((1 - Number(modelType)) * 100) : undefined,
            jurisdiction: jurisdiction !== undefined && jurisdiction !== null ? Math.round((1 - Number(jurisdiction)) * 100) : undefined,
          };
        }

        if (firmResult.rows.length > 0) {
          const overrides = loadOverrides();
          const evidenceResult = await dbPool.query(
            `SELECT id, key, source_url, sha256, excerpt, raw_object_path, created_at
             FROM evidence
             WHERE firm_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [firmResult.rows[0].firm_id, EVIDENCE_LIMIT]
          );

          const datapointResult = await dbPool.query(
            `SELECT DISTINCT ON (key) key, value_json
             FROM datapoints
             WHERE firm_id = $1
               AND key = ANY($2)
             ORDER BY key, created_at DESC`,
            [
              firmResult.rows[0].firm_id,
              [
                "rules_extracted_v0",
                "rules_extracted_from_home_v0",
                "pricing_extracted_v0",
                "pricing_extracted_from_home_v0",
              ],
            ]
          );

          const datapoints = new Map<string, any>();
          datapointResult.rows.forEach((row) => {
            datapoints.set(row.key, row.value_json);
          });

          const rulesValue =
            datapoints.get("rules_extracted_v0") ||
            datapoints.get("rules_extracted_from_home_v0");
          const pricingValue =
            datapoints.get("pricing_extracted_v0") ||
            datapoints.get("pricing_extracted_from_home_v0");
          const rulesData = unwrapDatapointValue(rulesValue);
          const pricingData = unwrapDatapointValue(pricingValue);

          const rulesEvidenceCandidates = [
            ...selectEvidenceCandidates(evidenceResult.rows, "rules_html"),
            ...selectEvidenceCandidates(evidenceResult.rows, "rules_pdf"),
          ];
          const pricingEvidenceCandidates = [
            ...selectEvidenceCandidates(evidenceResult.rows, "pricing_html"),
            ...selectEvidenceCandidates(evidenceResult.rows, "pricing_pdf"),
          ];
          const evidenceStart = Date.now();
          const rulesEvidenceData = await extractEvidenceData(rulesEvidenceCandidates);
          const pricingEvidenceData = await extractEvidenceData(pricingEvidenceCandidates);
          logEvent("info", "firm.evidence.extract", { duration_ms: Date.now() - evidenceStart });

          const evidenceRows = evidenceResult.rows.slice(0, EVIDENCE_LIMIT);
          let firmRecord = {
            ...firmResult.rows[0],
            audit_verdict: firmResult.rows[0].profile_audit_verdict || firmResult.rows[0].audit_verdict,
            evidence: evidenceRows,
          } as FirmRecord;

          firmRecord = {
            ...firmRecord,
            founded_year: pickFirstValue(
              firmRecord.founded_year as number | undefined,
              firmRecord.enriched_founded_year as number | undefined
            ),
            founded: pickFirstValue(
              firmRecord.founded as string | undefined,
              firmRecord.enriched_founded as string | undefined
            ),
            headquarters: pickFirstValue(
              firmRecord.headquarters as string | undefined,
              firmRecord.enriched_headquarters as string | undefined
            ),
            jurisdiction_tier: pickFirstValue(
              firmRecord.jurisdiction_tier as string | undefined,
              firmRecord.enriched_jurisdiction_tier as string | undefined
            ),
            rule_changes_frequency: pickFirstValue(
              firmRecord.rule_changes_frequency as string | undefined,
              firmRecord.enriched_rule_changes_frequency as string | undefined
            ),
            historical_consistency: pickFirstValue(
              firmRecord.historical_consistency as number | undefined,
              firmRecord.enriched_historical_consistency as number | undefined
            ),
          };

          const metricScores = firmRecord.metric_scores as Record<string, any> | undefined;
          const pillarScores = firmRecord.pillar_scores as Record<string, any> | undefined;

          const payoutFrequency = pickFirstValue(
            firmRecord.payout_frequency as string | undefined,
            metricScores?.payout_frequency as string | undefined,
            pricingData?.payout_frequency,
            rulesData?.payout_frequency,
            pricingEvidenceData.payout_frequency,
            rulesEvidenceData.payout_frequency
          );

          const maxDrawdownRule = sanitizeDrawdown(
            pickFirstValue(
              firmRecord.max_drawdown_rule as number | undefined,
              parseNumeric(metricScores?.max_drawdown_rule),
              parseNumeric(metricScores?.max_drawdown),
              parseNumeric(rulesData?.max_drawdown),
              parseNumeric(rulesData?.max_drawdown_rule),
              parseNumeric(rulesEvidenceData.max_drawdown_rule)
            ),
            { maxAllowed: 80 }
          );

          const dailyDrawdownRule = sanitizeDrawdown(
            pickFirstValue(
              firmRecord.daily_drawdown_rule as number | undefined,
              parseNumeric(metricScores?.daily_drawdown_rule),
              parseNumeric(metricScores?.daily_drawdown),
              parseNumeric(rulesData?.daily_drawdown),
              parseNumeric(rulesData?.daily_drawdown_rule),
              parseNumeric(rulesEvidenceData.daily_drawdown_rule)
            ),
            { maxAllowed: 30 }
          );

          const ruleChangesFrequency = pickFirstValue(
            firmRecord.rule_changes_frequency as string | undefined,
            metricScores?.rule_changes_frequency as string | undefined,
            metricScores?.rules_change_frequency as string | undefined,
            metricScores?.["rules.change_frequency"] as string | undefined,
            rulesEvidenceData.rule_changes_frequency
          );

          const payoutReliability = pickFirstValue(
            firmRecord.payout_reliability as number | undefined,
            pickPillarScore(pillarScores, ["payout"]),
            pickMetricScore(metricScores, ["payout_reliability", "payout.reliability"])
          );

          const riskModelIntegrity = pickFirstValue(
            firmRecord.risk_model_integrity as number | undefined,
            pickPillarScore(pillarScores, ["risk"]),
            pickMetricScore(metricScores, ["risk_model_integrity", "risk.model_integrity"])
          );

          const operationalStability = pickFirstValue(
            firmRecord.operational_stability as number | undefined,
            pickPillarScore(pillarScores, ["operational", "stability"]),
            pickMetricScore(metricScores, ["operational_stability", "operational.stability"])
          );

          const historicalConsistency = pickFirstValue(
            firmRecord.historical_consistency as number | undefined,
            pickPillarScore(pillarScores, ["historical", "consistency"]),
            pickMetricScore(metricScores, ["historical_consistency", "historical.consistency"])
          );

          firmRecord = {
            ...firmRecord,
            payout_frequency: payoutFrequency,
            max_drawdown_rule: maxDrawdownRule,
            daily_drawdown_rule: dailyDrawdownRule,
            rule_changes_frequency: ruleChangesFrequency,
            payout_reliability: payoutReliability,
            risk_model_integrity: riskModelIntegrity,
            operational_stability: operationalStability,
            historical_consistency: historicalConsistency,
            jurisdiction_tier:
              firmRecord.jurisdiction_tier || inferJurisdictionTier(firmRecord.jurisdiction as string | undefined),
            na_policy_applied:
              firmRecord.na_policy_applied !== undefined
                ? firmRecord.na_policy_applied
                : firmRecord.na_rate !== undefined && firmRecord.na_rate !== null,
            percentile_vs_universe: percentileStats.overall,
            percentile_vs_model_type: percentileStats.modelType,
            percentile_vs_jurisdiction: percentileStats.jurisdiction,
          };

          firmRecord = applyOverrides(firmRecord, overrides);
          firmRecord = applyDerivedFields(firmRecord);

          if (hasMissingEnrichedFields(firmRecord)) {
            const remoteSnapshot = await loadRemoteSnapshot();
            remoteSnapshotRecords = remoteSnapshot?.records || null;
            const remoteMatch = findSnapshotMatch(
              remoteSnapshot?.records,
              queryValue as string,
              firmRecord
            );
            if (remoteMatch) {
              firmRecord = mergeMissingFields(firmRecord, remoteMatch);
              firmRecord = applyDerivedFields(firmRecord);
              firmRecord = applySnapshotPercentiles(remoteSnapshotRecords || [], firmRecord);
              snapshotMetadata = {
                object: snapshotMetadata.object || remoteSnapshot?.metadata?.object,
                sha256: snapshotMetadata.sha256 || remoteSnapshot?.metadata?.sha256,
                created_at: snapshotMetadata.created_at || remoteSnapshot?.metadata?.created_at,
                snapshot_key: snapshotMetadata.snapshot_key || remoteSnapshot?.metadata?.snapshot_key,
                count: snapshotMetadata.count || evidenceResult.rows.length,
              };
            }
          }

          snapshotMetadata = {
            object: latestSnapshot?.object,
            sha256: latestSnapshot?.sha256,
            created_at: latestSnapshot?.created_at,
            snapshot_key: latestSnapshot?.snapshot_key,
            count: evidenceResult.rows.length,
          };

          const payload = { firm: firmRecord, snapshot: snapshotMetadata };
          if (FIRM_CACHE_TTL_MS > 0) {
            firmCache.set(cacheKey, { expiresAt: Date.now() + FIRM_CACHE_TTL_MS, payload });
          }
          logEvent("info", "firm.request", { duration_ms: Date.now() - requestStart });
          return res.status(200).json(payload);
        }

        // If DB has no firm match, fall back to remote snapshot data
        const remoteSnapshot = await loadRemoteSnapshot();
        const remoteMatch = findSnapshotMatch(remoteSnapshot?.records, queryValue as string);
        if (remoteMatch) {
          const overrides = loadOverrides();
          const merged = applyOverrides(remoteMatch, overrides);
          snapshotMetadata = {
            object: remoteSnapshot?.metadata?.object,
            sha256: remoteSnapshot?.metadata?.sha256,
            created_at: remoteSnapshot?.metadata?.created_at,
            snapshot_key: remoteSnapshot?.metadata?.snapshot_key,
            count: remoteSnapshot?.metadata?.count,
          };
          const payload = { firm: merged, snapshot: snapshotMetadata };
          if (FIRM_CACHE_TTL_MS > 0) {
            firmCache.set(cacheKey, { expiresAt: Date.now() + FIRM_CACHE_TTL_MS, payload });
          }
          logEvent("info", "firm.request", { duration_ms: Date.now() - requestStart });
          return res.status(200).json(payload);
        }
      } catch (dbError) {
        console.error('[API] DB lookup failed, falling back to snapshot:', dbError);
      }
    }

    const latestUrl = (process.env.NEXT_PUBLIC_SNAPSHOT_LATEST_URL || DEFAULT_LATEST_URL).trim();
    const bucketBase = (process.env.NEXT_PUBLIC_MINIO_BUCKET_BASE_URL || DEFAULT_BUCKET_BASE).trim();
    const pointerUrls = [latestUrl, ...FALLBACK_POINTER_URLS];

    const { data: latest, url: pointerUrl } = await fetchJsonWithFallback<LatestSnapshot>(pointerUrls, { cache: "no-store" });
    snapshotMetadata = latest;
    const roots = [bucketBase, ...FALLBACK_MINIO_ROOTS];
    const snapshotUrlCandidates = latest.object
      ? roots.map((root) => `${root.replace(/\/+$/, "")}/${latest.object!.replace(/^\/+/, "")}`)
      : [];

    if (!snapshotUrlCandidates.length) {
      return res.status(500).json({ error: "Latest snapshot URL missing" });
    }

    const { data: snapshotData, url: snapshotUrl } = await fetchJsonWithFallback<any>(snapshotUrlCandidates, { cache: "no-store" });
    logEvent("info", "firm.snapshot.remote", { pointerUrl, snapshotUrl });
    rows = Array.isArray(snapshotData)
      ? snapshotData
      : Array.isArray(snapshotData?.records)
      ? snapshotData.records
      : [];

    // Find firm by id or name
    const idStr = queryValue as string | undefined;
    const nameStr = Array.isArray(name) ? name[0] : (name as string | undefined);

    const normalizedQuery = nameStr ? normalizeName(nameStr) : "";

    let firmRecord = rows.find((f: FirmRecord) => {
      if (idStr) {
        return (f.firm_id || "").toLowerCase() === idStr.toLowerCase();
      }
      if (nameStr) {
        const firmName = (f.firm_name || f.name || "").toLowerCase();
        const queryName = nameStr.toLowerCase();
        return firmName === queryName || firmName.replace(/\s+/g, "") === queryName.replace(/\s+/g, "");
      }
      return false;
    });

    if (!firmRecord && nameStr) {
      const normalizedMatches = rows
        .map((f) => ({
          firm: f,
          normalized: normalizeName((f.firm_name || f.name || "") as string),
        }))
        .filter((entry) => entry.normalized.length > 0);

      firmRecord =
        normalizedMatches.find((entry) => entry.normalized === normalizedQuery)?.firm ||
        normalizedMatches
          .filter((entry) => entry.normalized.includes(normalizedQuery))
          .sort((a, b) => Math.abs(a.normalized.length - normalizedQuery.length) - Math.abs(b.normalized.length - normalizedQuery.length))[0]?.firm ||
        normalizedMatches
          .filter((entry) => normalizedQuery.includes(entry.normalized))
          .sort((a, b) => Math.abs(a.normalized.length - normalizedQuery.length) - Math.abs(b.normalized.length - normalizedQuery.length))[0]?.firm ||
        null;
    }

    if (!firmRecord) {
      return res.status(404).json({ error: `Firm not found: ${idStr || nameStr}` });
    }
    const overrides = loadOverrides();
          firmRecord = applyOverrides(firmRecord, overrides);
          firmRecord = applyDerivedFields(firmRecord);
          firmRecord = applySnapshotPercentiles(remoteSnapshotRecords || [], firmRecord);
    firmRecord = applyDerivedFields(firmRecord);
    firmRecord = applySnapshotPercentiles(rows, firmRecord);

    const payload = { firm: firmRecord, snapshot: snapshotMetadata };
    if (FIRM_CACHE_TTL_MS > 0) {
      firmCache.set(cacheKey, { expiresAt: Date.now() + FIRM_CACHE_TTL_MS, payload });
    }
    logEvent("info", "firm.request", { duration_ms: Date.now() - requestStart });
    return res.status(200).json(payload);
  } catch (error) {
    // Send Slack alert on complete failure
    try {
      await alertMinIOFailure('gpti-snapshots', (error as Error)?.message || 'Unknown error');
    } catch (alertError) {
      // Ignore alerting errors
    }
    
    logEvent("error", "firm.request", { duration_ms: Date.now() - requestStart });
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
