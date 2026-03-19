CREATE TABLE IF NOT EXISTS autonomous_experiments (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  candidate_config JSONB,
  baseline_snapshot_id INTEGER,
  candidate_snapshot_id INTEGER,
  orchestrator_report JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autonomous_experiments_module_status
  ON autonomous_experiments(module, status);

CREATE INDEX IF NOT EXISTS idx_autonomous_experiments_created_at
  ON autonomous_experiments(created_at DESC);

CREATE TABLE IF NOT EXISTS autonomous_promotion_queue (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  review_note TEXT,
  requested_by TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_autonomous_promotion_status_created
  ON autonomous_promotion_queue(status, created_at DESC);
