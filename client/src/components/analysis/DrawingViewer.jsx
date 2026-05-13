import { useEffect, useState } from 'react'
import { DrawingPage } from './DrawingPage'

export function DrawingViewer({ pages, issues, selectedIssueId, onSelectIssue, registerPageRef, pdfUrl }) {
  if (!pages || pages.length === 0) {
    return <PdfFallbackViewer pdfUrl={pdfUrl} />
  }

  return (
    <div className="drawing-viewer">
      {pages.map((page) => {
        const pageIssues = issues.filter((issue) => Number(issue.page || 1) === Number(page.pageNumber))
        return (
          <DrawingPage
            key={page.id || page.pageNumber}
            page={page}
            pageIssues={pageIssues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={onSelectIssue}
            pageRef={(node) => registerPageRef(page.pageNumber, node)}
          />
        )
      })}
    </div>
  )
}

function PdfFallbackViewer({ pdfUrl }) {
  const [blobUrl, setBlobUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let nextBlobUrl = ''

    async function loadPdfAsBlob() {
      if (!pdfUrl) {
        setError('PDF preview is unavailable.')
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch(pdfUrl, { credentials: 'include' })
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF (${res.status})`)
        }

        const blob = await res.blob()
        nextBlobUrl = URL.createObjectURL(blob)

        if (active) {
          setBlobUrl(nextBlobUrl)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load PDF preview')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadPdfAsBlob()

    return () => {
      active = false
      if (nextBlobUrl) {
        URL.revokeObjectURL(nextBlobUrl)
      }
    }
  }, [pdfUrl])

  if (loading) {
    return (
      <div className="drawing-viewer-fallback">
        <p>Loading PDF preview…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="drawing-viewer-fallback">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="drawing-viewer-fallback">
      <p>Rendered page images are not available yet. Showing PDF preview instead.</p>
      {blobUrl ? (
        <object data={blobUrl} type="application/pdf" className="drawing-pdf-frame">
          <p>
            PDF preview is unavailable in this browser.{' '}
            <a href={blobUrl} target="_blank" rel="noreferrer">Open PDF</a>
          </p>
        </object>
      ) : (
        <p>Preparing PDF preview…</p>
      )}
    </div>
  )
}
