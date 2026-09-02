CREATE TYPE "NativePdfExtractionStatus" AS ENUM ('PENDING', 'AVAILABLE', 'NO_TEXT', 'FAILED');

ALTER TABLE "drawing_pages"
ADD COLUMN "nativeText" TEXT,
ADD COLUMN "nativeArtifacts" JSONB,
ADD COLUMN "nativeExtractionStatus" "NativePdfExtractionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "nativeExtractionVersion" TEXT,
ADD COLUMN "nativeExtractionError" TEXT,
ADD COLUMN "nativeExtractedAt" TIMESTAMP(3);

CREATE INDEX "drawing_pages_nativeExtractionStatus_idx"
ON "drawing_pages"("nativeExtractionStatus");
