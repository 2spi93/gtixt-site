/**
 * Zod Validation Schemas for GTIXT APIs
 * Used for validating requests and responses
 * Ensures data integrity and type safety
 */

import { z } from "zod";

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

export const UUIDSchema = z.string().uuid();
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const ISO8601Schema = z.string().datetime();
export const SHA256Schema = z.string().regex(/^[a-f0-9]{64}$/);
export const ScoreSchema = z.number().min(0).max(100);
export const PercentageSchema = z.number().min(0).max(100);
export const WeightSchema = z.number().min(0).max(1);

// ============================================================================
// PILLAR TYPES
// ============================================================================

export const PillarIdSchema = z.enum([
  "regulatory_compliance",
  "financial_stability",
  "operational_risk",
  "governance",
  "client_protection",
  "market_conduct",
  "transparency_disclosure",
]);

export const ConfidenceLevelSchema = z.enum(["high", "medium", "low", "very_low", "na"]);
export const EvidenceTypeSchema = z.enum([
  "regulatory_filing",
  "regulatory_action",
  "financial_report",
  "audit",
  "news",
  "disclosure",
  "litigation",
]);
export const FirmStatusSchema = z.enum(["published", "pending", "retracted"]);

// ============================================================================
// EVIDENCE SCHEMAS
// ============================================================================

export const EvidenceItemSchema = z.object({
  type: EvidenceTypeSchema.describe("Type of evidence"),
  description: z.string().min(1).max(500).describe("Evidence description"),
  confidence: ConfidenceLevelSchema.describe("Confidence level"),
  timestamp: ISO8601Schema.describe("When evidence was collected"),
  source: z.string().min(1).max(100).describe("Source system"),
  value: z.number().min(0).max(100).optional().describe("Evidence score value"),
  reference_id: z.string().optional().describe("Evidence reference"),
});

export const PillarEvidenceSchema = z.object({
  pillar_id: PillarIdSchema,
  pillar_name: z.string().min(1).max(100),
  weight: WeightSchema,
  score: ScoreSchema,
  evidence: z.array(EvidenceItemSchema),
  verification_status: z.enum(["verified", "unverified"]),
});

export const FirmEvidenceSchema = z.object({
  firm_id: z.string().min(1).max(50),
  total_score: ScoreSchema,
  snapshot_date: DateSchema,
  evidence_by_pillar: z.array(PillarEvidenceSchema),
  verification_status: FirmStatusSchema,
  sha256: SHA256Schema,
});

// ============================================================================
// SNAPSHOT SCHEMAS
// ============================================================================

export const FirmSnapshotSchema = z.object({
  firm_id: z.string().min(1).max(50),
  firm_name: z.string().min(1).max(200),
  score: ScoreSchema,
  pillar_scores: z.record(PillarIdSchema, ScoreSchema),
  sha256: SHA256Schema,
  status: FirmStatusSchema,
  timestamp: ISO8601Schema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  percentile: PercentageSchema.optional(),
});

export const HistoricalSnapshotSchema = z.object({
  date: DateSchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  score: ScoreSchema,
  sha256: SHA256Schema,
  status: FirmStatusSchema,
  pillar_scores: z.record(PillarIdSchema, ScoreSchema).optional(),
});

// ============================================================================
// SPECIFICATION SCHEMAS
// ============================================================================

export const ScoringRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  condition: z.string().optional(),
  weight: WeightSchema,
});

export const PillarSpecificationSchema = z.object({
  id: PillarIdSchema,
  name: z.string().min(1).max(100),
  weight: WeightSchema,
  description: z.string().min(1).max(500),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  data_sources: z.array(z.string()),
  rules: z.array(ScoringRuleSchema),
});

export const ScoringSpecificationSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  effective_date: DateSchema,
  next_revision: DateSchema,
  pillars: z.array(PillarSpecificationSchema),
  aggregation_formula: z.string(),
  normalization: z.object({
    min: z.number(),
    max: z.number(),
    target_range: z.tuple([z.number(), z.number()]),
  }),
  fallback_policy: z.object({
    na_value: z.number(),
    description: z.string(),
  }),
});

// ============================================================================
// AUDIT TRAIL SCHEMAS
// ============================================================================

export const AuditRecordSchema = z.object({
  timestamp: ISO8601Schema,
  event_type: z.enum(["evidence_added", "evidence_reviewed", "score_snapshot", "evidence_retracted"]),
  firm_id: z.string().min(1).max(50),
  action: z.string().min(1).max(200),
  pillar_id: z.union([PillarIdSchema, z.literal("aggregate")]),
  evidence_type: z.union([EvidenceTypeSchema, z.literal("snapshot")]),
  evidence_description: z.string().min(1).max(500),
  confidence_before: ConfidenceLevelSchema.nullable(),
  confidence_after: ConfidenceLevelSchema,
  score_before: z.number().nullable(),
  score_after: ScoreSchema,
  operator_id: z.string().min(1).max(50),
  source: z.string().min(1).max(100),
  notes: z.string().min(0).max(1000),
  verification_status: FirmStatusSchema,
  sha256_before: SHA256Schema.nullable(),
  sha256_after: SHA256Schema,
});

export const AuditTrailExportSchema = z.object({
  export_metadata: z.object({
    firm_id: z.string().min(1).max(50),
    date_start: z.string(),
    date_end: z.string(),
    format: z.enum(["json", "csv"]),
    record_count: z.number().min(0),
    export_timestamp: ISO8601Schema,
    export_hash: z.string(),
  }),
  records: z.array(AuditRecordSchema).optional(),
  csv_data: z.string().optional(),
});

// ============================================================================
// VERIFICATION SCHEMAS
// ============================================================================

export const PillarVerificationSchema = z.object({
  pillar_id: PillarIdSchema,
  pillar_name: z.string().min(1).max(100),
  weight: WeightSchema,
  reported_score: ScoreSchema,
  computed_score: ScoreSchema,
  evidence_count: z.number().min(0),
  verification_status: z.enum(["match", "mismatch", "degraded"]),
});

export const VerificationResultSchema = z.object({
  success: z.boolean(),
  firm_id: z.string().min(1).max(50),
  snapshot_date: DateSchema,
  reported_score: ScoreSchema,
  computed_score: ScoreSchema,
  score_match: z.boolean(),
  reported_hash: z.string(),
  computed_hash: SHA256Schema,
  hash_match: z.boolean(),
  pillar_details: z.array(PillarVerificationSchema),
  verification_timestamp: ISO8601Schema,
  reproducibility_verification: z.object({
    deterministic: z.boolean(),
    evidence_complete: z.boolean(),
    rule_application_correct: z.boolean(),
    cryptographic_integrity: z.boolean(),
  }),
  message: z.string(),
});

// ============================================================================
// REQUEST VALIDATORS
// ============================================================================

export const QuerySnapshotHistorySchema = z.object({
  firm_id: z.string().min(1).max(50),
  version: z.string().default("v1.0"),
  date_start: DateSchema.optional(),
  date_end: DateSchema.optional(),
  limit: z.number().min(1).max(250).default(50),
});

export const QueryEvidenceSchema = z.object({
  firm_id: z.string().min(1).max(50),
  snapshot_date: DateSchema.optional(),
  version: z.string().default("v1.0"),
});

export const QueryAuditExportSchema = z.object({
  firm_id: z.string().min(1).max(50),
  date_start: DateSchema.optional(),
  date_end: DateSchema.optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export const BodyVerifyScoreSchema = z.object({
  firm_id: z.string().min(1).max(50),
  snapshot_date: DateSchema,
  reported_score: ScoreSchema,
  evidence: z.record(PillarIdSchema, z.object({
    score: ScoreSchema,
    items: z.array(EvidenceItemSchema),
  })),
  reported_hash: z.string().optional(),
  specification_version: z.string().default("v1.0"),
});

// ============================================================================
// RESPONSE VALIDATORS
// ============================================================================

export const ApiMetaSchema = z.object({
  api_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  spec_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  sdk_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  timestamp: ISO8601Schema,
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    z.object({
      success: z.literal(true),
      data: dataSchema,
      meta: ApiMetaSchema.optional(),
      message: z.string().optional(),
    }),
    z.object({
      success: z.literal(false),
      error: z.string(),
      message: z.string().optional(),
      meta: ApiMetaSchema.optional(),
    }),
  ]);

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.unknown().optional(),
  rule: z.string().optional(),
});

export const ValidationErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.literal(400),
  details: z.array(ValidationErrorSchema),
});

// ============================================================================
// SPECIFIC RESPONSE VALIDATORS
// ============================================================================

export const LatestSnapshotResponseSchema = ApiResponseSchema(
  z.array(FirmSnapshotSchema),
);

export const SnapshotHistoryResponseSchema = ApiResponseSchema(
  z.object({
    snapshots: z.array(HistoricalSnapshotSchema),
    total_count: z.number(),
  }),
);

export const EvidenceResponseSchema = ApiResponseSchema(FirmEvidenceSchema);

export const SpecificationResponseSchema = ApiResponseSchema(ScoringSpecificationSchema);

export const AuditExportResponseSchema = ApiResponseSchema(AuditTrailExportSchema);

export const VerifyScoreResponseSchema = ApiResponseSchema(VerificationResultSchema);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate and parse data with Zod schema
 * Returns data or throws validation error
 */
export function validateAndParse<T>(schema: z.ZodSchema, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues);
  }
  return result.data as T;
}

/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  constructor(
    public errors: z.ZodIssue[],
  ) {
    super("Validation failed");
    this.name = "ValidationError";
  }

  getDetails() {
    return this.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      value: undefined,
      rule: err.code,
    }));
  }
}
