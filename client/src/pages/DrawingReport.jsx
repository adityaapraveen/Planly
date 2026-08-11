import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { getDrawingReport } from '../api/drawings.api'
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
import { Button } from '../components/ui/Button'
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
  const [interactionMessage, setInteractionMessage] = useState('')
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

  const pages = useMemo(() => mapPages(drawing?.pages), [drawing?.pages])
  const issues = useMemo(() => normalizeIssues(drawing?.analysis?.issues), [drawing?.analysis?.issues])
  const pdfUrl = useMemo(() => {
    return toApiUrl(drawing?.fileUrl || drawing?.filePath)
  }, [drawing?.filePath, drawing?.fileUrl])

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

  const handleIssueStatusChange = async (issue, nextStatus) => {
    try {
      setError('')
      const res = await updateAnalysisIssue(issue.id, nextStatus)
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
    } catch (err) {
      setError(err.message || 'Failed to update finding status')
    }
  }

  const registerPageRef = (pageNumber, node) => {
    if (node) {
      pageRefs.current[pageNumber] = node
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
          <h1>{drawing.fileName}</h1>
          <p>AI drawing report and issue overlays</p>
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
        <div className="report-inline-error" style={{ borderColor: 'var(--primary-200)', background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
          <span>Retry requested. Analysis is restarting…</span>
        </div>
      )}

      {interactionMessage && (
        <div className="report-inline-error" style={{ borderColor: 'var(--neutral-200)', background: 'var(--neutral-50)', color: 'var(--neutral-700)' }}>
          <span>{interactionMessage}</span>
        </div>
      )}

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
                selectedIssueId={selectedIssueId}
                onSelectIssue={handleSelectIssue}
                registerPageRef={registerPageRef}
                pdfUrl={pdfUrl}
              />
            </div>
            <IssueSidebar
              issues={issues}
              selectedIssueId={selectedIssueId}
              onSelectIssue={handleSelectIssue}
              onStatusChange={handleIssueStatusChange}
            />
          </div>
        </>
      )}
    </div>
  )
}
