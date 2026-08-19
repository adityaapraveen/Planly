ALTER TABLE "project_questions"
ADD COLUMN "retrievalMode" TEXT NOT NULL DEFAULT 'LEXICAL',
ADD COLUMN "retrievalTrace" JSONB;

CREATE TABLE "project_evidence_chunks" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embedding" JSONB,
    "embeddingModel" TEXT,
    "embeddingDimensions" INTEGER,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_evidence_chunks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_evidence_chunks_projectId_sourceId_key"
ON "project_evidence_chunks"("projectId", "sourceId");

CREATE INDEX "project_evidence_chunks_projectId_evidenceType_idx"
ON "project_evidence_chunks"("projectId", "evidenceType");

CREATE INDEX "project_evidence_chunks_projectId_updatedAt_idx"
ON "project_evidence_chunks"("projectId", "updatedAt");

ALTER TABLE "project_evidence_chunks"
ADD CONSTRAINT "project_evidence_chunks_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
