import { IssueOverlay } from './IssueOverlay'
import { ReferenceOverlay } from './ReferenceOverlay'

export function DrawingPage({
  page,
  pageIssues,
  pageReferences,
  selectedIssueId,
  selectedReferenceId,
  onSelectIssue,
  onSelectReference,
  pageRef,
}) {
  return (
    <section className="drawing-page" ref={pageRef} id={`drawing-page-${page.pageNumber}`}>
      <div className="drawing-page-label">Page {page.pageNumber}</div>
      <div className="drawing-image-wrap">
        <img
          src={page.imageUrl}
          alt={`Drawing page ${page.pageNumber}`}
          loading="lazy"
          className="drawing-image"
        />
        {pageIssues.map((issue, index) => {
          const overlayId = issue.id || `${issue.page || page.pageNumber}-${index}`
          return (
            <IssueOverlay
              key={overlayId}
              issue={issue}
              selected={overlayId === selectedIssueId}
              onClick={onSelectIssue}
              overlayId={overlayId}
            />
          )
        })}
        {pageReferences.map((reference) => (
          <ReferenceOverlay
            key={reference.id}
            reference={reference}
            selected={reference.id === selectedReferenceId}
            onClick={onSelectReference}
          />
        ))}
      </div>
    </section>
  )
}
