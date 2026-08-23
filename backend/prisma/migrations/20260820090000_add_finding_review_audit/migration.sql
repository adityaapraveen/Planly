-- Add structured human-review metadata to the current finding state.
ALTER TABLE "analysis_issues"
ADD COLUMN "reviewReason" TEXT,
ADD COLUMN "reviewerNote" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- Preserve every reviewer transition as an immutable audit event.
CREATE TABLE "analysis_issue_review_events" (
    "id" TEXT NOT NULL,
    "previousStatus" "AnalysisIssueStatus" NOT NULL,
    "status" "AnalysisIssueStatus" NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "issueId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analysis_issue_review_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analysis_issue_review_events_issueId_createdAt_idx"
ON "analysis_issue_review_events"("issueId", "createdAt");

CREATE INDEX "analysis_issue_review_events_reviewerId_createdAt_idx"
ON "analysis_issue_review_events"("reviewerId", "createdAt");

ALTER TABLE "analysis_issue_review_events"
ADD CONSTRAINT "analysis_issue_review_events_issueId_fkey"
FOREIGN KEY ("issueId") REFERENCES "analysis_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analysis_issue_review_events"
ADD CONSTRAINT "analysis_issue_review_events_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
