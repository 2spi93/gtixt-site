import type { NextApiRequest, NextApiResponse } from "next";
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

const minioEndpoint = (() => {
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

const tryExtractFromEvidence = async (rawObjectPath?: string | null) => {
  const url = buildRawUrl(rawObjectPath);
  if (!url) return {};
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
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
    const res = await fetch(sourceUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
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
  process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
  "http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json";

const DEFAULT_BUCKET_BASE =
  process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT ||
  "http://51.210.246.61:9000/gpti-snapshots/";

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

async function loadRemoteSnapshot(): Promise<{ records: FirmRecord[]; metadata?: LatestSnapshot } | null> {
  try {
    const latestUrl = (process.env.NEXT_PUBLIC_SNAPSHOT_LATEST_URL || DEFAULT_LATEST_URL).trim();
    const bucketBase = (process.env.NEXT_PUBLIC_MINIO_BUCKET_BASE_URL || DEFAULT_BUCKET_BASE).trim();
    const pointerUrls = [latestUrl, ...FALLBACK_POINTER_URLS];

    const { data: latest, url: pointerUrl } = await fetchJsonWithFallback<LatestSnapshot>(pointerUrls, { cache: "no-store" });
    const roots = [bucketBase, ...FALLBACK_MINIO_ROOTS];
    const snapshotUrlCandidates = latest.object
      ? roots.map((root) => `${root.replace(/\/+$/, "")}/${latest.object!.replace(/^\/+/, "")}`)
      : [];

    if (!snapshotUrlCandidates.length) {
      return null;
    }

    const { data: snapshotData, url: snapshotUrl } = await fetchJsonWithFallback<any>(snapshotUrlCandidates, { cache: "no-store" });
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

  res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
  const { id, name, firmId } = req.query;
  const queryValue = (Array.isArray(id) ? id[0] : id) || (Array.isArray(firmId) ? firmId[0] : firmId) || (Array.isArray(name) ? name[0] : name);

  if (!queryValue) {
    return res.status(400).json({ error: "Missing id or name parameter" });
  }

  try {
    let rows: FirmRecord[] = [];
    let snapshotMetadata: LatestSnapshot = {};

    const dbPool = getPool();
    if (dbPool) {
      try {
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
             ss.score_0_100,
             ss.confidence,
             ss.na_rate,
             ss.pillar_scores,
             ss.metric_scores
           FROM firms f
           LEFT JOIN firm_profiles fp ON f.firm_id = fp.firm_id
           LEFT JOIN snapshot_scores ss ON f.firm_id = ss.firm_id
             AND ss.snapshot_id = $2
           WHERE f.firm_id = $1
              OR lower(f.name) = lower($1)
              OR lower(f.brand_name) = lower($1)
           LIMIT 1`,
          [queryValue, latestSnapshot?.id || null]
        );

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
          const evidenceResult = await dbPool.query(
            `SELECT id, key, source_url, sha256, excerpt, raw_object_path, created_at
             FROM evidence
             WHERE firm_id = $1
             ORDER BY created_at DESC`,
            [firmResult.rows[0].firm_id]
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

          const rulesEvidence = evidenceResult.rows.find((row) => row.key === "rules_html");
          const pricingEvidence = evidenceResult.rows.find((row) => row.key === "pricing_html");
          let rulesEvidenceData = await tryExtractFromEvidence(rulesEvidence?.raw_object_path);
          let pricingEvidenceData = await tryExtractFromEvidence(pricingEvidence?.raw_object_path);

          if (!rulesEvidenceData.payout_frequency || !rulesEvidenceData.max_drawdown_rule) {
            const fromSource = await tryExtractFromSourceUrl(rulesEvidence?.source_url);
            rulesEvidenceData = { ...fromSource, ...rulesEvidenceData };
          }

          if (!pricingEvidenceData.payout_frequency) {
            const fromSource = await tryExtractFromSourceUrl(pricingEvidence?.source_url);
            pricingEvidenceData = { ...fromSource, ...pricingEvidenceData };
          }

          let firmRecord = {
            ...firmResult.rows[0],
            audit_verdict: firmResult.rows[0].profile_audit_verdict || firmResult.rows[0].audit_verdict,
            evidence: evidenceResult.rows,
          } as FirmRecord;

          const metricScores = firmRecord.metric_scores as Record<string, any> | undefined;
          const pillarScores = firmRecord.pillar_scores as Record<string, any> | undefined;

          const payoutFrequency = pickFirstValue(
            firmRecord.payout_frequency as string | undefined,
            pricingData?.payout_frequency,
            rulesData?.payout_frequency,
            pricingEvidenceData.payout_frequency,
            rulesEvidenceData.payout_frequency
          );

          const maxDrawdownRule = pickFirstValue(
            firmRecord.max_drawdown_rule as number | undefined,
            parseNumeric(rulesData?.max_drawdown),
            parseNumeric(rulesData?.daily_drawdown),
            parseNumeric(rulesData?.max_drawdown_rule),
            parseNumeric(rulesEvidenceData.max_drawdown_rule),
            parseNumeric(rulesEvidenceData.daily_drawdown_rule)
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

          if (hasMissingEnrichedFields(firmRecord)) {
            const remoteSnapshot = await loadRemoteSnapshot();
            const remoteMatch = findSnapshotMatch(
              remoteSnapshot?.records,
              queryValue as string,
              firmRecord
            );
            if (remoteMatch) {
              firmRecord = mergeMissingFields(firmRecord, remoteMatch);
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

          return res.status(200).json({ firm: firmRecord, snapshot: snapshotMetadata });
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

    return res.status(200).json({ firm: firmRecord, snapshot: snapshotMetadata });
  } catch (error) {
    // Send Slack alert on complete failure
    try {
      await alertMinIOFailure('gpti-snapshots', (error as Error)?.message || 'Unknown error');
    } catch (alertError) {
      // Ignore alerting errors
    }
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
