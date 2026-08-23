import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { getDrawingReport, updateSheetMetadata } from '../api/drawings.api'
import {
  getDrawingAnalysis,
  triggerDrawingAnalysis,
  updateAnalysisIssue,
} from '../api/analysis.api'
import { StatusBadge } from '../components/analysis/StatusBadge'
import { AnalysisLoader } from '../components/analysis/AnalysisLoader'
import { AnalysisSummary } from '../components/analysis/AnalysisSummary'
import { DrawingViewer } from '../components/analysis/DrawingViewer'
import { IssueSidebar } from '../components/analysis/IssueSidebar'
import { SheetIndex } from '../components/analysis/SheetIndex'
import { ReferenceGraph } from '../components/analysis/ReferenceGraph'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import './DrawingReport.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const POLL_MS = 3000
const REVIEW_MODE_OPTIONS = [
  { value: 'SUBMISSION_READINESS', label: 'Submission Readiness' },
  { value: 'DOCUMENTATION_REVIEW', label: 'Documentation Review' },
  { value: 'CONSTRUCTABILITY_REVIEW', label: 'Constructability Review' },
  { value: 'COORDINATION_REVIEW', label: 'Coordination Review' },
  { value: 'COMPLIANCE_RISK_REVIEW', label: 'Compliance Risk Review' },
]

function normalizeIssues(issues) {
  return Array.isArray(issues) ? issues : []
}

function toApiUrl(rawPath) {
  if (!rawPath) return ''
  if (/^https?:\/\//i.test(rawPath)) return rawPath

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`
  const safeBase = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  return `${safeBase}${normalizedPath}`
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function mapPages(pages) {
  return (pages || []).map((page) => {
    return {
      ...page,
      imageUrl: toApiUrl(page.imageUrl || page.imagePath),
    }
  })
}

export function DrawingReport() {
  const { drawingId } = useParams()
  const [reviewMode, setReviewMode] = useState('SUBMISSION_READINESS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState(null)
  const [selectedReferenceId, setSelectedReferenceId] = useState(null)
  const [interactionMessage, setInteractionMessage] = useState('')
  const [savingSheetId, setSavingSheetId] = useState(null)
  const [decisionTarget, setDecisionTarget] = useState(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const [savingDecision, setSavingDecision] = useState(false)
  const pageRefs = useRef({})

  const fetchReport = useCallback(async () => {
    const res = await getDrawingReport(drawingId)
    return res.data?.drawing || null
  }, [drawingId])

  const fetchAnalysisForMode = useCallback(async (mode) => {
    try {
      const res = await getDrawingAnalysis(drawingId, mode)
      return res.data?.analysis || null
    } catch (err) {
      if (err?.status === 404) return null
      throw err
    }
  }, [drawingId])

  const loadDrawing = useCallback(async (mode) => {
    const [report, modeAnalysis] = await Promise.all([
      fetchReport(),
      fetchAnalysisForMode(mode),
    ])

    const nextDrawing = report
      ? { ...report, analysis: modeAnalysis }
      : null
    setDrawing(nextDrawing)

    const params = new URLSearchParams(window.location.search)
    const linkedFindingId = params.get('finding')
    const linkedReferenceId = params.get('reference')
    if (linkedFindingId && modeAnalysis?.issues?.some((issue) => issue.id === linkedFindingId)) {
      setSelectedIssueId(linkedFindingId)
    }
    if (linkedReferenceId && report?.referenceGraph?.references?.some((reference) => reference.id === linkedReferenceId)) {
      setSelectedReferenceId(linkedReferenceId)
    }

    return nextDrawing
  }, [fetchAnalysisForMode, fetchReport])

  useEffect(() => {
    let active = true

    async function run() {
      setLoading(true)
      setError('')
      try {
        await loadDrawing(reviewMode)
      } catch (err) {
        if (active) setError(err.message || 'Failed to load drawing report')
      } finally {
        if (active) setLoading(false)
      }
    }

    run()
    return () => {
      active = false
    }
  }, [loadDrawing, reviewMode])

  useEffect(() => {
    if (!drawing) return
    const analysisStatus = drawing.analysis?.status
    if (analysisStatus !== 'PENDING' && analysisStatus !== 'PROCESSING') return

    const timer = setInterval(async () => {
      try {
        await loadDrawing(reviewMode)
      } catch {
        // keep previous state and continue polling
      }
    }, POLL_MS)

    return () => clearInterval(timer)
  }, [drawing, loadDrawing, reviewMode])

  const drawingPages = drawing?.pages
  const analysisIssues = drawing?.analysis?.issues
  const graphReferences = drawing?.referenceGraph?.references
  const pages = useMemo(() => mapPages(drawingPages), [drawingPages])
  const issues = useMemo(() => normalizeIssues(analysisIssues), [analysisIssues])
  const references = useMemo(() => graphReferences || [], [graphReferences])
  const pdfUrl = toApiUrl(drawing?.fileUrl || drawing?.filePath)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const findingId = selectedIssueId || params.get('finding')
    const referenceId = selectedReferenceId || params.get('reference')
    const issue = findingId ? issues.find((candidate) => candidate.id === findingId) : null
    const reference = referenceId ? references.find((candidate) => candidate.id === referenceId) : null
    const pageNumber = Number(issue?.page || reference?.source?.pageNumber || params.get('page') || 1)

    if (!issue && !reference && !params.has('page')) return

    const node = pageRefs.current[pageNumber]
    if (node) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      node.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
    }
  }, [issues, references, selectedIssueId, selectedReferenceId])

  const handleRetry = async () => {
    try {
      setRetrying(true)
      setError('')
      const force = drawing?.analysis?.status === 'FAILED' ||
        drawing?.analysis?.status === 'COMPLETED'
      const res = await triggerDrawingAnalysis(drawingId, reviewMode, force)
      const nextStatus = res?.data?.status || 'PENDING'
      const nextAnalysis = res?.data?.analysis

      setDrawing((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          status: nextStatus,
          analysis: nextAnalysis || null,
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to retry analysis')
    } finally {
      setRetrying(false)
    }
  }

  const handleSelectIssue = (issue, id) => {
    setInteractionMessage('')
    setSelectedReferenceId(null)
    setSelectedIssueId(id)

    if (issue?.hasLocation === false) {
      setInteractionMessage('This issue has no pinpoint location, so only the card is highlighted.')
      return
    }

    const pageNumber = Number(issue.page || 1)
    const node = pageRefs.current[pageNumber]
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleIssueStatusChange = (issue, nextStatus) => {
    if (nextStatus === issue.status) return
    setDecisionTarget({ issue, nextStatus })
    setDecisionReason('')
    setDecisionNote(issue.reviewerNote || '')
  }

  const closeDecisionModal = () => {
    if (savingDecision) return
    setDecisionTarget(null)
    setDecisionReason('')
    setDecisionNote('')
  }

  const saveFindingDecision = async () => {
    if (!decisionTarget) return
    if (decisionTarget.nextStatus === 'DISMISSED' && !decisionReason.trim()) return

    try {
      setSavingDecision(true)
      setError('')
      const res = await updateAnalysisIssue(decisionTarget.issue.id, {
        status: decisionTarget.nextStatus,
        reason: decisionReason.trim() || null,
        note: decisionNote.trim() || null,
      })
      const updatedIssue = res.data?.issue

      setDrawing((prev) => {
        if (!prev?.analysis || !updatedIssue) return prev
        return {
          ...prev,
          analysis: {
            ...prev.analysis,
            issues: prev.analysis.issues.map((item) =>
              item.id === updatedIssue.id ? updatedIssue : item),
          },
        }
      })
      setInteractionMessage('Human decision saved to the immutable finding audit trail.')
      closeDecisionModal()
    } catch (err) {
      setError(err.message || 'Failed to update finding status')
    } finally {
      setSavingDecision(false)
      setDecisionTarget(null)
    }
  }

  const handleCopyFindingLink = async (issue) => {
    const url = new URL(window.location.href)
    url.searchParams.set('finding', issue.id)
    try {
      await navigator.clipboard.writeText(url.toString())
      setInteractionMessage('Exact finding link copied to the clipboard.')
    } catch {
      setInteractionMessage(`Copy this finding link: ${url.toString()}`)
    }
  }

  const handleExportFindings = () => {
    const headers = ['Finding ID', 'Title', 'Severity', 'Category', 'Page', 'Model confidence', 'Status', 'Reviewer rationale', 'Reviewer note', 'Reviewed at']
    const rows = issues.map((issue) => [
      issue.id,
      issue.title,
      issue.severity,
      issue.category,
      issue.page,
      issue.confidence,
      issue.status || 'OPEN',
      issue.reviewReason,
      issue.reviewerNote,
      issue.reviewedAt,
    ])
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${drawing.fileName.replace(/\.pdf$/i, '')}-${reviewMode.toLowerCase()}-review-register.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const registerPageRef = (pageNumber, node) => {
    if (node) {
      pageRefs.current[pageNumber] = node
    }
  }

  const handleSelectReference = (reference) => {
    setInteractionMessage('')
    setSelectedIssueId(null)
    setSelectedReferenceId(reference.id)

    const pageNumber = Number(reference.source?.pageNumber || 1)
    const node = pageRefs.current[pageNumber]
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    if (reference.hasLocation === false) {
      setInteractionMessage('This reference has no pinpoint location; its source page has been selected.')
    }
  }

  const handleSaveSheet = async (sheetId, changes) => {
    try {
      setSavingSheetId(sheetId)
      setError('')
      await updateSheetMetadata(sheetId, changes)
      await loadDrawing(reviewMode)
      setInteractionMessage('Sheet metadata saved. Human corrections will be preserved on future AI reruns.')
    } catch (err) {
      setError(err.message || 'Failed to save sheet metadata')
    } finally {
      setSavingSheetId(null)
    }
  }

  const handleConfirmSheet = async (sheetId) => {
    try {
      setSavingSheetId(sheetId)
      setError('')
      await updateSheetMetadata(sheetId, { reviewStatus: 'CONFIRMED' })
      await loadDrawing(reviewMode)
      setInteractionMessage('Sheet metadata confirmed.')
    } catch (err) {
      setError(err.message || 'Failed to confirm sheet metadata')
    } finally {
      setSavingSheetId(null)
    }
  }

  if (loading) return <PageLoader text="Loading drawing report…" />

  if (error && !drawing) {
    return (
      <div className="report-state">
        <AlertCircle size={18} />
        <p>{error}</p>
        <Button onClick={() => loadDrawing(reviewMode)}>Retry</Button>
      </div>
    )
  }

  if (!drawing) {
    return (
      <div className="report-state">
        <p>Drawing report unavailable.</p>
      </div>
    )
  }

  const status = drawing.analysis?.status || 'NOT_STARTED'

  return (
    <div className="drawing-report-page">
      <header className="report-header">
        <div>
          <span className="page-eyebrow">Evidence review workspace</span>
          <h1>{drawing.fileName}</h1>
          <p>Inspect the drawing, cited findings, and reviewer decisions in one place.</p>
        </div>
        <div className="report-header-actions">
          <label className="review-mode-field" htmlFor="review-mode">
            <span>Review Mode</span>
            <select
              id="review-mode"
              value={reviewMode}
              onChange={(event) => setReviewMode(event.target.value)}
            >
              {REVIEW_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <StatusBadge status={status} />
          {status === 'COMPLETED' && (
            <Button variant="secondary" onClick={handleRetry} disabled={retrying}>
              <RefreshCcw size={14} /> {retrying ? 'Starting…' : 'Run Again'}
            </Button>
          )}
        </div>
      </header>

      {error && (
        <div className="report-inline-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {retrying && (
        <div className="report-inline-error informational">
          <span>Retry requested. Analysis is restarting…</span>
        </div>
      )}

      {interactionMessage && (
        <div className="report-inline-error neutral">
          <span>{interactionMessage}</span>
        </div>
      )}

      <SheetIndex
        sheetIndex={drawing.sheetIndex}
        analysisStatus={status}
        savingSheetId={savingSheetId}
        onSave={handleSaveSheet}
        onConfirm={handleConfirmSheet}
      />

      <ReferenceGraph
        graph={drawing.referenceGraph}
        selectedReferenceId={selectedReferenceId}
        onSelectReference={handleSelectReference}
      />

      {status === 'NOT_STARTED' ? (
        <div className="report-state">
          <p>No {REVIEW_MODE_OPTIONS.find((item) => item.value === reviewMode)?.label} analysis has been run yet.</p>
          <Button onClick={handleRetry} disabled={retrying}>
            {retrying ? 'Starting…' : 'Run Analysis'}
          </Button>
        </div>
      ) : status === 'FAILED' ? (
        <div className="report-state failed">
          <p>Analysis failed for this drawing in {REVIEW_MODE_OPTIONS.find((item) => item.value === reviewMode)?.label}.</p>
          <Button onClick={handleRetry} disabled={retrying}>
            <RefreshCcw size={14} /> {retrying ? 'Retrying…' : 'Retry Analysis'}
          </Button>
        </div>
      ) : status === 'PENDING' || status === 'PROCESSING' ? (
        <AnalysisLoader status={status} />
      ) : (
        <>
          <AnalysisSummary analysis={drawing.analysis} issues={issues} />
          <div className="report-layout">
            <div className="report-viewer-pane">
              <DrawingViewer
                pages={pages}
                issues={issues}
                references={references}
                selectedIssueId={selectedIssueId}
                selectedReferenceId={selectedReferenceId}
                onSelectIssue={handleSelectIssue}
                onSelectReference={handleSelectReference}
                registerPageRef={registerPageRef}
                pdfUrl={pdfUrl}
              />
            </div>
            <IssueSidebar
              issues={issues}
              selectedIssueId={selectedIssueId}
              onSelectIssue={handleSelectIssue}
              onStatusChange={handleIssueStatusChange}
              onCopyLink={handleCopyFindingLink}
              onExport={handleExportFindings}
            />
          </div>
        </>
      )}

      <Modal
        isOpen={!!decisionTarget}
        onClose={closeDecisionModal}
        title="Record human decision"
        footer={(
          <>
            <Button variant="secondary" onClick={closeDecisionModal} disabled={savingDecision}>Cancel</Button>
            <Button
              onClick={saveFindingDecision}
              disabled={savingDecision || (decisionTarget?.nextStatus === 'DISMISSED' && !decisionReason.trim())}
            >
              {savingDecision ? 'Saving…' : 'Save decision'}
            </Button>
          </>
        )}
      >
        <div className="finding-decision-form">
          <div className="finding-decision-context">
            <span>{decisionTarget?.issue?.severity} finding · Page {decisionTarget?.issue?.page}</span>
            <strong>{decisionTarget?.issue?.title}</strong>
            <p>
              Change from {decisionTarget?.issue?.status || 'OPEN'} to {decisionTarget?.nextStatus}.
              The actor, rationale, and timestamp will be retained in the audit trail.
            </p>
          </div>
          {['RESOLVED', 'DISMISSED'].includes(decisionTarget?.nextStatus) && (
            <label>
              <span>Reviewer rationale {decisionTarget?.nextStatus === 'DISMISSED' ? '(required)' : '(recommended)'}</span>
              <input
                value={decisionReason}
                maxLength={500}
                autoFocus
                onChange={(event) => setDecisionReason(event.target.value)}
                placeholder={decisionTarget?.nextStatus === 'DISMISSED' ? 'Why is this finding not applicable or incorrect?' : 'What evidence confirms resolution?'}
              />
            </label>
          )}
          <label>
            <span>Review note (optional)</span>
            <textarea
              value={decisionNote}
              maxLength={2000}
              rows={4}
              autoFocus={!['RESOLVED', 'DISMISSED'].includes(decisionTarget?.nextStatus)}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder="Add project context or follow-up instructions."
            />
          </label>
          <p className="finding-decision-disclaimer">AI findings are advisory. This decision records professional review; it is not a certification of compliance.</p>
        </div>
      </Modal>
    </div>
  )
}
