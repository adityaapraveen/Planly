import { IssueOverlay } from './IssueOverlay'

export function DrawingPage({ page, pageIssues, selectedIssueId, onSelectIssue, pageRef }) {
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
      </div>
    </section>
  )
}
