ALTER TABLE "drawings" ADD COLUMN "revisionOfId" TEXT;

CREATE INDEX "drawings_revisionOfId_idx" ON "drawings"("revisionOfId");

ALTER TABLE "drawings"
ADD CONSTRAINT "drawings_revisionOfId_fkey"
FOREIGN KEY ("revisionOfId") REFERENCES "drawings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
