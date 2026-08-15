CREATE TYPE "ProjectQuestionStatus" AS ENUM ('ANSWERED', 'INSUFFICIENT_EVIDENCE');
CREATE TYPE "CheckSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "project_questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "status" "ProjectQuestionStatus" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "citations" JSONB NOT NULL,
    "evidenceSnapshot" JSONB NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "promptVersion" TEXT NOT NULL DEFAULT 'cited-project-qa-v1',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_check_settings" (
    "id" TEXT NOT NULL,
    "checkKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "severity" "CheckSeverity" NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_check_settings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_questions_projectId_createdAt_idx" ON "project_questions"("projectId", "createdAt");
CREATE UNIQUE INDEX "project_check_settings_projectId_checkKey_key" ON "project_check_settings"("projectId", "checkKey");
CREATE INDEX "project_check_settings_projectId_enabled_idx" ON "project_check_settings"("projectId", "enabled");

ALTER TABLE "project_questions"
ADD CONSTRAINT "project_questions_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_check_settings"
ADD CONSTRAINT "project_check_settings_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
