-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalysisIssueStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- Existing analyses are completed historical runs. New runs start as pending.
ALTER TABLE "analyses"
    ADD COLUMN "status" "AnalysisStatus" NOT NULL DEFAULT 'COMPLETED',
    ADD COLUMN "errorCode" TEXT,
    ADD COLUMN "errorMessage" TEXT,
    ADD COLUMN "provider" TEXT,
    ADD COLUMN "model" TEXT,
    ADD COLUMN "promptVersion" TEXT NOT NULL DEFAULT 'legacy',
    ADD COLUMN "attempt" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "durationMs" INTEGER,
    ADD COLUMN "startedAt" TIMESTAMP(3),
    ADD COLUMN "completedAt" TIMESTAMP(3);

ALTER TABLE "analyses" ALTER COLUMN "score" DROP NOT NULL;
ALTER TABLE "analyses" ALTER COLUMN "summary" DROP NOT NULL;
ALTER TABLE "analyses" ALTER COLUMN "issues" DROP NOT NULL;

UPDATE "analyses"
SET "completedAt" = "updatedAt"
WHERE "completedAt" IS NULL;

DROP INDEX "analyses_drawingId_reviewMode_key";

CREATE INDEX "analyses_drawingId_reviewMode_createdAt_idx"
ON "analyses"("drawingId", "reviewMode", "createdAt");

CREATE INDEX "analyses_status_idx" ON "analyses"("status");

-- CreateTable
CREATE TABLE "analysis_issues" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "page" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "hasLocation" BOOLEAN NOT NULL DEFAULT true,
    "explanation" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "status" "AnalysisIssueStatus" NOT NULL DEFAULT 'OPEN',
    "analysisId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analysis_issues_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analysis_issues_analysisId_status_idx"
ON "analysis_issues"("analysisId", "status");

CREATE INDEX "analysis_issues_severity_idx"
ON "analysis_issues"("severity");

ALTER TABLE "analysis_issues"
ADD CONSTRAINT "analysis_issues_analysisId_fkey"
FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing findings as queryable issue rows.
INSERT INTO "analysis_issues" (
    "id", "title", "category", "severity", "confidence", "page",
    "x", "y", "width", "height", "hasLocation", "explanation",
    "recommendation", "analysisId", "updatedAt"
)
SELECT
    'legacy-' || analysis."id" || '-' || issue.ordinality,
    COALESCE(issue.value->>'title', 'Untitled issue'),
    COALESCE(issue.value->>'category', 'Drawing Quality'),
    COALESCE(issue.value->>'severity', 'Medium'),
    COALESCE((issue.value->>'confidence')::DOUBLE PRECISION, 0.5),
    COALESCE((issue.value->>'page')::INTEGER, 1),
    COALESCE((issue.value->'location'->>'x')::DOUBLE PRECISION, 0),
    COALESCE((issue.value->'location'->>'y')::DOUBLE PRECISION, 0),
    COALESCE((issue.value->'location'->>'width')::DOUBLE PRECISION, 0),
    COALESCE((issue.value->'location'->>'height')::DOUBLE PRECISION, 0),
    COALESCE((issue.value->>'hasLocation')::BOOLEAN,
        COALESCE((issue.value->'location'->>'width')::DOUBLE PRECISION, 0) > 0
        AND COALESCE((issue.value->'location'->>'height')::DOUBLE PRECISION, 0) > 0),
    COALESCE(issue.value->>'explanation', ''),
    COALESCE(issue.value->>'recommendation', ''),
    analysis."id",
    analysis."updatedAt"
FROM "analyses" AS analysis
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(analysis."issues", '[]'::jsonb))
WITH ORDINALITY AS issue(value, ordinality);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "refresh_sessions_tokenHash_key" ON "refresh_sessions"("tokenHash");
CREATE INDEX "refresh_sessions_userId_revokedAt_idx" ON "refresh_sessions"("userId", "revokedAt");
CREATE INDEX "refresh_sessions_expiresAt_idx" ON "refresh_sessions"("expiresAt");

ALTER TABLE "refresh_sessions"
ADD CONSTRAINT "refresh_sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Future analyses should start pending and identify the current prompt contract.
ALTER TABLE "analyses" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "analyses" ALTER COLUMN "promptVersion" SET DEFAULT 'v1';
