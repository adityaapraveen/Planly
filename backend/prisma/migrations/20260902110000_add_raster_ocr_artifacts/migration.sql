CREATE TYPE "DrawingPageOcrStatus" AS ENUM (
    'PENDING',
    'DISABLED',
    'NOT_REQUIRED',
    'AVAILABLE',
    'NO_TEXT',
    'FAILED'
);

ALTER TABLE "drawing_pages"
ADD COLUMN "ocrText" TEXT,
ADD COLUMN "ocrArtifacts" JSONB,
ADD COLUMN "ocrStatus" "DrawingPageOcrStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "ocrVersion" TEXT,
ADD COLUMN "ocrError" TEXT,
ADD COLUMN "ocrExtractedAt" TIMESTAMP(3);

CREATE INDEX "drawing_pages_ocrStatus_idx"
ON "drawing_pages"("ocrStatus");
