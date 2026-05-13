-- DropIndex
DROP INDEX "analyses_drawingId_key";

-- CreateIndex
CREATE UNIQUE INDEX "analyses_drawingId_reviewMode_key" ON "analyses"("drawingId", "reviewMode");
