-- AlterTable
ALTER TABLE "AdminValidation" ALTER COLUMN "status" SET DEFAULT 'pending';

-- CreateTable
CREATE TABLE "agent_c_audit" (
    "snapshot_key" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "version_key" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "na_rate" DECIMAL NOT NULL,
    "reasons" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_c_audit_pkey" PRIMARY KEY ("snapshot_key","firm_id","version_key")
);

-- CreateTable
CREATE TABLE "agent_status" (
    "agent" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "evidence_types" JSONB NOT NULL DEFAULT '[]',
    "performance_ms" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_status_pkey" PRIMARY KEY ("agent")
);

-- CreateTable
CREATE TABLE "asic_review_queue" (
    "id" SERIAL NOT NULL,
    "firm_id" TEXT NOT NULL,
    "firm_name" TEXT NOT NULL,
    "afs_name" TEXT NOT NULL,
    "fuzzy_score" DECIMAL(5,4) NOT NULL,
    "asic_abn" TEXT,
    "asic_acn" TEXT,
    "asic_afs_licence" TEXT,
    "asic_company_status" TEXT,
    "asic_lookup_source" TEXT,
    "review_status" TEXT DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "reviewer_notes" TEXT,
    "verification_method" TEXT,
    "verification_reference" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asic_review_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asic_verification_audit" (
    "id" SERIAL NOT NULL,
    "review_queue_id" INTEGER,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "triggered_by" TEXT DEFAULT 'system',
    "occurred_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asic_verification_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datapoints" (
    "id" SERIAL NOT NULL,
    "firm_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value_json" JSONB,
    "value_text" TEXT,
    "source_url" TEXT,
    "evidence_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "datapoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firm_id" VARCHAR(255),
    "firm_name" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "event_date" TIMESTAMPTZ(6) NOT NULL,
    "severity" VARCHAR(20),
    "source_url" VARCHAR(500),
    "source_title" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" VARCHAR(255),
    "notes" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" SERIAL NOT NULL,
    "firm_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source_url" TEXT,
    "sha256" TEXT NOT NULL,
    "excerpt" TEXT,
    "raw_object_path" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_collection" (
    "evidence_id" SERIAL NOT NULL,
    "firm_id" VARCHAR(50) NOT NULL,
    "evidence_type" VARCHAR(50) NOT NULL,
    "evidence_source" VARCHAR(100) NOT NULL,
    "evidence_hash" VARCHAR(64) NOT NULL,
    "content_text" TEXT,
    "content_json" JSONB,
    "content_url" TEXT,
    "content_snapshot_path" TEXT,
    "collected_by" VARCHAR(50) NOT NULL,
    "collection_method" VARCHAR(50),
    "relevance_score" DOUBLE PRECISION,
    "relevance_reason" TEXT,
    "affects_metric" VARCHAR(50),
    "affects_score_version" VARCHAR(20),
    "impact_weight" DOUBLE PRECISION,
    "is_verified" BOOLEAN DEFAULT false,
    "verified_by" VARCHAR(100),
    "verified_at" TIMESTAMPTZ(6),
    "verification_notes" TEXT,
    "is_stale" BOOLEAN DEFAULT false,
    "is_ambiguous" BOOLEAN DEFAULT false,
    "confidence_level" VARCHAR(20),
    "collected_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "evidence_collection_pkey" PRIMARY KEY ("evidence_id")
);

-- CreateTable
CREATE TABLE "evidence_provenance" (
    "evidence_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firm_id" TEXT NOT NULL,
    "snapshot_id" UUID,
    "pillar_id" VARCHAR(50),
    "source_system" VARCHAR(100) NOT NULL,
    "source_url" TEXT,
    "crawler_agent" VARCHAR(100) NOT NULL,
    "crawler_version" VARCHAR(20) NOT NULL,
    "extraction_method" VARCHAR(50) NOT NULL,
    "extraction_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "operator_id" VARCHAR(100),
    "transformation_chain" JSONB NOT NULL DEFAULT '[]',
    "validation" JSONB NOT NULL DEFAULT '{}',
    "raw_data_hash" VARCHAR(64),
    "raw_data_archive_url" TEXT,
    "evidence_hash" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100) NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,

    CONSTRAINT "evidence_provenance_pkey" PRIMARY KEY ("evidence_id")
);

-- CreateTable
CREATE TABLE "evidence_validation_results" (
    "id" SERIAL NOT NULL,
    "evidence_id" INTEGER NOT NULL,
    "firm_id" TEXT NOT NULL,
    "validation" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_validation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firm_enrichment" (
    "firm_id" TEXT NOT NULL,
    "founded_year" INTEGER,
    "founded" TEXT,
    "headquarters" TEXT,
    "jurisdiction_tier" TEXT,
    "rule_changes_frequency" TEXT,
    "historical_consistency" TEXT,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "asic_body_status" TEXT,
    "asic_source" TEXT,
    "asic_last_verified" TIMESTAMPTZ(6),

    CONSTRAINT "firm_enrichment_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "firm_profiles" (
    "firm_id" TEXT NOT NULL,
    "executive_summary" TEXT,
    "status_gtixt" TEXT,
    "data_sources" JSONB,
    "verification_hash" TEXT,
    "last_updated" TIMESTAMPTZ(6),
    "audit_verdict" TEXT,
    "oversight_gate_verdict" TEXT,
    "extra" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firm_profiles_pkey" PRIMARY KEY ("firm_id")
);

-- CreateTable
CREATE TABLE "firms" (
    "id" SERIAL NOT NULL,
    "firm_id" TEXT,
    "name" TEXT,
    "brand_name" TEXT,
    "website_root" TEXT,
    "model_type" TEXT,
    "status" TEXT,
    "fca_reference" TEXT,
    "jurisdiction" TEXT,
    "jurisdiction_tier" TEXT,
    "logo_url" TEXT,
    "founded_year" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "payout_frequency" TEXT,
    "max_drawdown_rule" DECIMAL(5,2),
    "daily_drawdown_rule" DECIMAL(5,2),
    "rule_changes_frequency" TEXT,
    "headquarters" TEXT,
    "payout_split_pct" DECIMAL(5,2),
    "account_size_usd" DECIMAL(15,2),
    "payout_reliability" DECIMAL(5,2),
    "risk_model_integrity" DECIMAL(5,2),
    "operational_stability" DECIMAL(5,2),
    "historical_consistency" DECIMAL(5,2),
    "na_rate" DECIMAL(5,2),
    "operational_status" TEXT DEFAULT 'active',

    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_records" (
    "record_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "record_type" VARCHAR(50) NOT NULL,
    "decision_id" VARCHAR(100),
    "decision_type" VARCHAR(50),
    "proposal_date" DATE,
    "decision_date" DATE,
    "votes" JSONB,
    "outcome" JSONB,
    "decision_details" JSONB,
    "minutes_url" TEXT,
    "error_id" VARCHAR(100),
    "detected_date" TIMESTAMPTZ(6),
    "severity" VARCHAR(20),
    "error_description" TEXT,
    "root_cause" TEXT,
    "affected_data" JSONB,
    "correction_applied" JSONB,
    "post_mortem" JSONB,
    "contestation_id" VARCHAR(100),
    "firm_id" VARCHAR(100),
    "submitted_date" DATE,
    "submitted_by" VARCHAR(200),
    "claim" JSONB,
    "investigation" JSONB,
    "contestation_decision" JSONB,
    "public_record_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100) NOT NULL,

    CONSTRAINT "governance_records_pkey" PRIMARY KEY ("record_id")
);

-- CreateTable
CREATE TABLE "ground_truth_events" (
    "event_id" SERIAL NOT NULL,
    "firm_id" VARCHAR(50) NOT NULL,
    "event_date" DATE NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "event_severity" VARCHAR(20) NOT NULL,
    "event_description" TEXT NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "source_url" TEXT,
    "source_reliability" VARCHAR(20) NOT NULL,
    "expected_score_impact" INTEGER,
    "expected_direction" VARCHAR(10),
    "validated_by" VARCHAR(100),
    "validated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "validation_notes" TEXT,
    "is_verified" BOOLEAN DEFAULT false,
    "verification_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ground_truth_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "internal_access_log" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "occurred_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'reviewer',
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "totp_secret" VARCHAR(64),
    "totp_enabled" BOOLEAN DEFAULT false,
    "password_reset_token" VARCHAR(64),
    "password_reset_expires" TIMESTAMPTZ(6),
    "password_last_changed" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multi_level_hashes" (
    "hash_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dataset_timestamp" TIMESTAMPTZ(6) NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "dataset_hash" VARCHAR(64) NOT NULL,
    "merkle_root" VARCHAR(64) NOT NULL,
    "merkle_tree_height" INTEGER NOT NULL,
    "total_firms_count" INTEGER NOT NULL,
    "firm_hashes" JSONB NOT NULL DEFAULT '{}',
    "merkle_proofs" JSONB,
    "hash_algorithm" VARCHAR(20) NOT NULL DEFAULT 'sha256',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "multi_level_hashes_pkey" PRIMARY KEY ("hash_id")
);

-- CreateTable
CREATE TABLE "provenance_graphs" (
    "graph_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firm_id" TEXT NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "snapshot_id" UUID,
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "root_nodes" JSONB NOT NULL DEFAULT '[]',
    "final_node" TEXT NOT NULL,
    "reproducibility" JSONB NOT NULL DEFAULT '{}',
    "node_count" INTEGER NOT NULL,
    "edge_count" INTEGER NOT NULL,
    "graph_depth" INTEGER NOT NULL,
    "specification_version" VARCHAR(20) NOT NULL,
    "code_commit_hash" VARCHAR(40) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provenance_graphs_pkey" PRIMARY KEY ("graph_id")
);

-- CreateTable
CREATE TABLE "score_version" (
    "version_key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data_dictionary" JSONB NOT NULL,
    "weights" JSONB NOT NULL,
    "hierarchy" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_version_pkey" PRIMARY KEY ("version_key")
);

-- CreateTable
CREATE TABLE "snapshot_audit" (
    "id" SERIAL NOT NULL,
    "snapshot_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshot_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_metadata" (
    "id" SERIAL NOT NULL,
    "snapshot_key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "object" TEXT NOT NULL,
    "sha256" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "snapshot_uuid" UUID DEFAULT gen_random_uuid(),
    "snapshot_hash" VARCHAR(64),
    "previous_snapshot_hash" VARCHAR(64),
    "signature" TEXT,
    "signed_by" VARCHAR(100),
    "signed_at" TIMESTAMPTZ(6),
    "merkle_root" VARCHAR(64),
    "code_commit_hash" VARCHAR(40),
    "dependencies" JSONB,
    "evidence_archive_url" TEXT,
    "runtime_version" VARCHAR(20),
    "reproducible" BOOLEAN DEFAULT true,
    "reviewed_by" VARCHAR(100),
    "reviewed_at" TIMESTAMPTZ(6),
    "approved_by" VARCHAR(100),
    "approved_at" TIMESTAMPTZ(6),
    "publication_timestamp" TIMESTAMPTZ(6),
    "retracted_at" TIMESTAMPTZ(6),
    "retracted_by" VARCHAR(100),
    "retraction_reason" TEXT,
    "replacement_snapshot_uuid" UUID,
    "publish_type" TEXT,

    CONSTRAINT "snapshot_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snapshot_scores" (
    "snapshot_id" INTEGER NOT NULL,
    "firm_id" TEXT NOT NULL,
    "snapshot_key" TEXT,
    "version_key" TEXT,
    "score" JSONB,
    "score_0_100" DECIMAL,
    "pillar_scores" JSONB,
    "metric_scores" JSONB,
    "na_rate" DECIMAL,
    "confidence" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "snapshot_scores_pkey" PRIMARY KEY ("snapshot_id","firm_id")
);

-- CreateTable
CREATE TABLE "validation_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshot_id" VARCHAR(255) NOT NULL,
    "alert_type" VARCHAR(100) NOT NULL,
    "severity" VARCHAR(20),
    "metric_name" VARCHAR(100),
    "current_value" DECIMAL(8,4),
    "threshold_value" DECIMAL(8,4),
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "validation_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshot_id" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "total_firms" INTEGER,
    "firms_with_rules_extracted" INTEGER,
    "firms_with_pricing_extracted" INTEGER,
    "coverage_percent" DECIMAL(5,2),
    "avg_na_rate" DECIMAL(5,2),
    "agent_c_pass_rate" DECIMAL(5,2),
    "prev_snapshot_id" VARCHAR(255),
    "avg_score_change" DECIMAL(8,4),
    "top_10_turnover" INTEGER,
    "top_20_turnover" INTEGER,
    "verdict_churn_rate" DECIMAL(5,2),
    "pillar_sensitivity_mean" DECIMAL(8,4),
    "fallback_usage_percent" DECIMAL(5,2),
    "stability_score" DECIMAL(5,2),
    "events_in_period" INTEGER,
    "events_predicted" INTEGER,
    "prediction_precision" DECIMAL(5,2),
    "score_distribution_skew" DECIMAL(8,4),
    "jurisdiction_bias_score" DECIMAL(5,2),
    "model_type_bias_score" DECIMAL(5,2),
    "evidence_linkage_rate" DECIMAL(5,2),
    "version_metadata" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_records" (
    "validation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evidence_item_id" UUID NOT NULL,
    "snapshot_id" UUID,
    "llm_validation" JSONB,
    "rule_validation" JSONB,
    "heuristic_validation" JSONB,
    "cross_reference_validation" JSONB,
    "overall_confidence" VARCHAR(20) NOT NULL,
    "validation_score" DECIMAL(5,2) NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "flags" TEXT[],
    "reviewer_notes" TEXT,
    "validated_by" VARCHAR(100) NOT NULL,
    "validation_timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validation_duration_ms" INTEGER,

    CONSTRAINT "validation_records_pkey" PRIMARY KEY ("validation_id")
);

-- CreateTable
CREATE TABLE "AdminCrawls" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "url" TEXT NOT NULL,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCrawls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminJobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminJobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminOperations" (
    "id" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "firmId" TEXT,
    "userId" TEXT NOT NULL DEFAULT 'system',
    "status" TEXT NOT NULL DEFAULT 'success',
    "details" JSONB,
    "auditLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminOperations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPlans" (
    "id" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "tasksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAlerts" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "firmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAlerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_asic_review_created" ON "asic_review_queue"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_asic_review_firm_id" ON "asic_review_queue"("firm_id");

-- CreateIndex
CREATE INDEX "idx_asic_review_status" ON "asic_review_queue"("review_status");

-- CreateIndex
CREATE UNIQUE INDEX "asic_review_queue_firm_id_fuzzy_score_key" ON "asic_review_queue"("firm_id", "fuzzy_score");

-- CreateIndex
CREATE INDEX "idx_asic_audit_occurred" ON "asic_verification_audit"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_asic_audit_review_id" ON "asic_verification_audit"("review_queue_id");

-- CreateIndex
CREATE INDEX "idx_datapoints_created_at" ON "datapoints"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_datapoints_firm_key" ON "datapoints"("firm_id", "key");

-- CreateIndex
CREATE INDEX "idx_evidence_key" ON "evidence"("key");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_firm_id_key_sha256_key" ON "evidence"("firm_id", "key", "sha256");

-- CreateIndex
CREATE INDEX "idx_evidence_collected_at" ON "evidence_collection"("collected_at" DESC);

-- CreateIndex
CREATE INDEX "idx_evidence_collected_by" ON "evidence_collection"("collected_by");

-- CreateIndex
CREATE INDEX "idx_evidence_content_json" ON "evidence_collection" USING GIN ("content_json");

-- CreateIndex
CREATE INDEX "idx_evidence_firm_collected" ON "evidence_collection"("firm_id", "collected_at" DESC);

-- CreateIndex
CREATE INDEX "idx_evidence_firm_id" ON "evidence_collection"("firm_id");

-- CreateIndex
CREATE INDEX "idx_evidence_firm_metric" ON "evidence_collection"("firm_id", "affects_metric");

-- CreateIndex
CREATE INDEX "idx_evidence_hash" ON "evidence_collection"("evidence_hash");

-- CreateIndex
CREATE INDEX "idx_evidence_metric" ON "evidence_collection"("affects_metric");

-- CreateIndex
CREATE INDEX "idx_evidence_type" ON "evidence_collection"("evidence_type");

-- CreateIndex
CREATE INDEX "idx_evidence_verified" ON "evidence_collection"("is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_provenance_evidence_hash_key" ON "evidence_provenance"("evidence_hash");

-- CreateIndex
CREATE INDEX "idx_evidence_provenance_extraction_ts" ON "evidence_provenance"("extraction_timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_evidence_provenance_firm" ON "evidence_provenance"("firm_id");

-- CreateIndex
CREATE INDEX "idx_evidence_provenance_hash" ON "evidence_provenance"("evidence_hash");

-- CreateIndex
CREATE INDEX "idx_evidence_provenance_raw_hash" ON "evidence_provenance"("raw_data_hash");

-- CreateIndex
CREATE INDEX "idx_evidence_provenance_snapshot" ON "evidence_provenance"("snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "firms_firm_id_key" ON "firms"("firm_id");

-- CreateIndex
CREATE INDEX "idx_firms_status" ON "firms"("status");

-- CreateIndex
CREATE INDEX "idx_firms_updated_at" ON "firms"("updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "governance_records_decision_id_key" ON "governance_records"("decision_id");

-- CreateIndex
CREATE UNIQUE INDEX "governance_records_error_id_key" ON "governance_records"("error_id");

-- CreateIndex
CREATE UNIQUE INDEX "governance_records_contestation_id_key" ON "governance_records"("contestation_id");

-- CreateIndex
CREATE INDEX "idx_governance_records_created" ON "governance_records"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_governance_records_type" ON "governance_records"("record_type");

-- CreateIndex
CREATE INDEX "idx_events_created" ON "ground_truth_events"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_events_date" ON "ground_truth_events"("event_date" DESC);

-- CreateIndex
CREATE INDEX "idx_events_firm_date" ON "ground_truth_events"("firm_id", "event_date" DESC);

-- CreateIndex
CREATE INDEX "idx_events_firm_id" ON "ground_truth_events"("firm_id");

-- CreateIndex
CREATE INDEX "idx_events_severity" ON "ground_truth_events"("event_severity");

-- CreateIndex
CREATE INDEX "idx_events_type" ON "ground_truth_events"("event_type");

-- CreateIndex
CREATE INDEX "idx_events_verified" ON "ground_truth_events"("is_verified");

-- CreateIndex
CREATE INDEX "idx_internal_access_log_occurred" ON "internal_access_log"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "idx_internal_access_log_user_id" ON "internal_access_log"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_sessions_token_key" ON "internal_sessions"("token");

-- CreateIndex
CREATE INDEX "idx_internal_sessions_expires" ON "internal_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "idx_internal_sessions_token" ON "internal_sessions"("token");

-- CreateIndex
CREATE INDEX "idx_internal_sessions_user_id" ON "internal_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_username_key" ON "internal_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "internal_users_email_key" ON "internal_users"("email");

-- CreateIndex
CREATE INDEX "idx_internal_users_active" ON "internal_users"("active");

-- CreateIndex
CREATE INDEX "idx_internal_users_role" ON "internal_users"("role");

-- CreateIndex
CREATE INDEX "idx_internal_users_totp_enabled" ON "internal_users"("totp_enabled");

-- CreateIndex
CREATE INDEX "idx_internal_users_username" ON "internal_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "unique_dataset_timestamp" ON "multi_level_hashes"("dataset_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "multi_level_hashes_dataset_hash_key" ON "multi_level_hashes"("dataset_hash");

-- CreateIndex
CREATE INDEX "idx_multi_level_hashes_dataset_hash" ON "multi_level_hashes"("dataset_hash");

-- CreateIndex
CREATE INDEX "idx_multi_level_hashes_firm_hashes_gin" ON "multi_level_hashes" USING GIN ("firm_hashes");

-- CreateIndex
CREATE INDEX "idx_multi_level_hashes_merkle_root" ON "multi_level_hashes"("merkle_root");

-- CreateIndex
CREATE INDEX "idx_multi_level_hashes_snapshot_date" ON "multi_level_hashes"("snapshot_date" DESC);

-- CreateIndex
CREATE INDEX "idx_multi_level_hashes_timestamp" ON "multi_level_hashes"("dataset_timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_provenance_graphs_date" ON "provenance_graphs"("snapshot_date" DESC);

-- CreateIndex
CREATE INDEX "idx_provenance_graphs_edges_gin" ON "provenance_graphs" USING GIN ("edges");

-- CreateIndex
CREATE INDEX "idx_provenance_graphs_final_node" ON "provenance_graphs"("final_node");

-- CreateIndex
CREATE INDEX "idx_provenance_graphs_firm" ON "provenance_graphs"("firm_id");

-- CreateIndex
CREATE INDEX "idx_provenance_graphs_nodes_gin" ON "provenance_graphs" USING GIN ("nodes");

-- CreateIndex
CREATE INDEX "idx_provenance_graphs_snapshot" ON "provenance_graphs"("snapshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_firm_snapshot_date" ON "provenance_graphs"("firm_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "idx_snapshot_metadata_uuid" ON "snapshot_metadata"("snapshot_uuid");

-- CreateIndex
CREATE INDEX "idx_snapshot_metadata_created_at" ON "snapshot_metadata"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_snapshot_scores_created_at" ON "snapshot_scores"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_snapshot_scores_firm_id" ON "snapshot_scores"("firm_id");

-- CreateIndex
CREATE INDEX "idx_validation_alerts_snapshot_type" ON "validation_alerts"("snapshot_id", "alert_type");

-- CreateIndex
CREATE UNIQUE INDEX "validation_metrics_snapshot_id_key" ON "validation_metrics"("snapshot_id");

-- CreateIndex
CREATE INDEX "idx_validation_metrics_snapshot" ON "validation_metrics"("snapshot_id");

-- CreateIndex
CREATE INDEX "idx_validation_metrics_timestamp" ON "validation_metrics"("timestamp");

-- CreateIndex
CREATE INDEX "idx_validation_records_approved" ON "validation_records"("approved");

-- CreateIndex
CREATE INDEX "idx_validation_records_confidence" ON "validation_records"("overall_confidence");

-- CreateIndex
CREATE INDEX "idx_validation_records_evidence" ON "validation_records"("evidence_item_id");

-- CreateIndex
CREATE INDEX "idx_validation_records_llm_gin" ON "validation_records" USING GIN ("llm_validation");

-- CreateIndex
CREATE INDEX "idx_validation_records_rule_gin" ON "validation_records" USING GIN ("rule_validation");

-- CreateIndex
CREATE INDEX "idx_validation_records_snapshot" ON "validation_records"("snapshot_id");

-- CreateIndex
CREATE INDEX "idx_validation_records_timestamp" ON "validation_records"("validation_timestamp" DESC);

-- CreateIndex
CREATE INDEX "AdminCrawls_status_createdAt_idx" ON "AdminCrawls"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminJobs_jobType_status_createdAt_idx" ON "AdminJobs"("jobType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminOperations_operationType_operation_createdAt_idx" ON "AdminOperations"("operationType", "operation", "createdAt");

-- CreateIndex
CREATE INDEX "AdminOperations_firmId_createdAt_idx" ON "AdminOperations"("firmId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminPlans_status_createdAt_idx" ON "AdminPlans"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAlerts_isRead_createdAt_idx" ON "AdminAlerts"("isRead", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAlerts_alertType_severity_idx" ON "AdminAlerts"("alertType", "severity");

-- AddForeignKey
ALTER TABLE "asic_review_queue" ADD CONSTRAINT "asic_review_queue_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("firm_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "asic_verification_audit" ADD CONSTRAINT "asic_verification_audit_review_queue_id_fkey" FOREIGN KEY ("review_queue_id") REFERENCES "asic_review_queue"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evidence_provenance" ADD CONSTRAINT "fk_evidence_firm" FOREIGN KEY ("firm_id") REFERENCES "firms"("firm_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evidence_provenance" ADD CONSTRAINT "fk_evidence_snapshot" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_metadata"("snapshot_uuid") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "firm_profiles" ADD CONSTRAINT "firm_profiles_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("firm_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "internal_access_log" ADD CONSTRAINT "internal_access_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "internal_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "internal_sessions" ADD CONSTRAINT "internal_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "internal_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provenance_graphs" ADD CONSTRAINT "fk_graph_firm" FOREIGN KEY ("firm_id") REFERENCES "firms"("firm_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provenance_graphs" ADD CONSTRAINT "fk_graph_snapshot" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_metadata"("snapshot_uuid") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "snapshot_audit" ADD CONSTRAINT "snapshot_audit_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_metadata"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "snapshot_metadata" ADD CONSTRAINT "fk_snapshot_replacement" FOREIGN KEY ("replacement_snapshot_uuid") REFERENCES "snapshot_metadata"("snapshot_uuid") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "snapshot_scores" ADD CONSTRAINT "snapshot_scores_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_metadata"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validation_records" ADD CONSTRAINT "fk_validation_evidence" FOREIGN KEY ("evidence_item_id") REFERENCES "evidence_provenance"("evidence_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "validation_records" ADD CONSTRAINT "fk_validation_snapshot" FOREIGN KEY ("snapshot_id") REFERENCES "snapshot_metadata"("snapshot_uuid") ON DELETE SET NULL ON UPDATE NO ACTION;
