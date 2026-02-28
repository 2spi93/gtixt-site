-- Add AdminValidation table
CREATE TABLE IF NOT EXISTS "AdminValidation" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "abn" TEXT,
  "status" TEXT NOT NULL,
  "enrichmentLevel" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "AdminValidation_status_createdAt_idx"
  ON "AdminValidation" ("status", "createdAt");
