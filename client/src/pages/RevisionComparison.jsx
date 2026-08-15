import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileDiff,
  GitCompareArrows,
  Layers3,
  MinusCircle,
  PlusCircle,
  RefreshCcw,
} from 'lucide-react'
import { getRevisionComparison } from '../services/drawing.service'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { PageLoader } from '../components/ui/Spinner'
import './RevisionComparison.css'

const FILTERS = ['ALL', 'MODIFIED', 'ADDED', 'REMOVED', 'UNCHANGED']
const FIELD_LABELS = {
  sheetNumber: 'Sheet number',
  title: 'Title',
  discipline: 'Discipline',
  revision: 'Revision',
  issueDate: 'Issue date',
}

const statusIcon = {
  ADDED: PlusCircle,
  REMOVED: MinusCircle,
  MODIFIED: FileDiff,
  UNCHANGED: CheckCircle2,
}

function SheetEvidence({ label, drawing, sheet, emptyMessage }) {
  return (
    <article className="revision-evidence-panel">
      <header>
        <div>
          <span>{label}</span>
          <strong>{drawing.fileName}</strong>
        </div>
        {sheet && <small>Page {sheet.pageNumber}</small>}
      </header>
      {sheet ? (
        <>
          <div className="revision-sheet-meta">
            <strong>{sheet.sheetNumber || `Page ${sheet.pageNumber}`}</strong>
            <span>{sheet.title || 'Untitled sheet'}</span>
            {sheet.revision && <b>Revision {sheet.revision}</b>}
          </div>
          {sheet.imageUrl ? (
            <a href={sheet.imageUrl} target="_blank" rel="noreferrer" className="revision-image-link">
              <img loading="lazy" src={sheet.imageUrl} alt={`${label}: ${sheet.sheetNumber || `page ${sheet.pageNumber}`}`} />
              <span><ExternalLink size={13} /> Open source page</span>
            </a>
          ) : (
            <div className="revision-evidence-empty">Page image unavailable.</div>
          )}
        </>
      ) : (
        <div className="revision-evidence-empty"><Layers3 size={22} /><span>{emptyMessage}</span></div>
      )}
    </article>
  )
}

function FindingGroup({ status, items }) {
  const copy = {
    NEW: ['New in current revision', 'Needs reviewer attention'],
    RESOLVED: ['No longer detected', 'Verify the intended resolution'],
    PERSISTING: ['Still detected', 'Carried forward from the previous issue'],
  }[status]

  return (
    <section className={`revision-finding-group ${status.toLowerCase()}`}>
      <header><div><h3>{copy[0]}</h3><p>{copy[1]}</p></div><span>{items.length}</span></header>
      {items.length === 0 ? (
        <p className="revision-finding-empty">No findings in this category.</p>
      ) : items.map((change) => {
        const finding = change.current || change.previous
        return (
          <article className="revision-finding" key={change.key}>
            <div><span className={`revision-severity ${String(finding.severity).toLowerCase()}`}>{finding.severity}</span><small>{finding.sheetNumber || `Page ${finding.page}`}</small></div>
            <strong>{finding.title}</strong>
            <p>{finding.explanation}</p>
          </article>
        )
      })}
    </section>
  )
}

export function RevisionComparison() {
  const { drawingId } = useParams()
  const navigate = useNavigate()
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [selectedKey, setSelectedKey] = useState(null)

  const loadComparison = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const response = await getRevisionComparison(drawingId)
      setComparison(response.data?.comparison || null)
    } catch (err) {
      setError(err.message || 'Failed to compare drawing revisions')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [drawingId])

  useEffect(() => {
    Promise.resolve().then(loadComparison)
  }, [loadComparison])

  useEffect(() => {
    if (comparison?.status !== 'PROCESSING') return undefined
    const timer = window.setInterval(() => loadComparison({ silent: true }), 3000)
    return () => window.clearInterval(timer)
  }, [comparison?.status, loadComparison])

  const visibleSheets = useMemo(() => {
    const changes = comparison?.sheets?.changes || []
    return filter === 'ALL' ? changes : changes.filter((item) => item.status === filter)
  }, [comparison, filter])

  const selectedSheet = useMemo(() => {
    const explicitSelection = visibleSheets.find((item) => item.key === selectedKey)
    const firstImportant = visibleSheets.find((item) => item.status !== 'UNCHANGED')
    return explicitSelection || firstImportant || visibleSheets[0] || null
  }, [selectedKey, visibleSheets])

  const findingsByStatus = useMemo(() => {
    const changes = comparison?.findings?.changes || []
    return Object.fromEntries(['NEW', 'RESOLVED', 'PERSISTING'].map((status) => [
      status,
      changes.filter((item) => item.status === status),
    ]))
  }, [comparison])

  if (loading) return <PageLoader text="Matching drawing revisions…" />
  if (error && !comparison) return <ErrorState message={error} onRetry={() => loadComparison()} />
  if (!comparison) return <ErrorState message="Revision comparison is unavailable." onRetry={() => loadComparison()} />

  const summary = comparison.sheets.summary
  const findingSummary = comparison.findings.summary

  return (
    <div className="revision-page">
      <header className="revision-header">
        <button className="revision-back" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <div className="revision-header-row">
          <div>
            <span className="page-eyebrow">Revision intelligence · deterministic comparison</span>
            <h1>What changed between drawing issues?</h1>
            <div className="revision-file-route">
              <span>{comparison.previous.fileName}</span><ArrowRight size={14} /><strong>{comparison.current.fileName}</strong>
            </div>
          </div>
          <div className="revision-header-actions">
            <Link className="btn btn-secondary" to={`/drawings/${comparison.current.id}/report`}>Current report <ExternalLink size={14} /></Link>
            <Button onClick={() => loadComparison()}><RefreshCcw size={14} /> Refresh</Button>
          </div>
        </div>
      </header>

      {error && <div className="revision-callout danger"><AlertTriangle size={16} /> {error}</div>}
      {comparison.status === 'PROCESSING' && (
        <div className="revision-callout processing"><Clock3 size={16} /><div><strong>Current revision analysis is still running</strong><span>The comparison refreshes automatically. Sheet results may change until processing completes.</span></div></div>
      )}
      {comparison.status === 'FAILED' && (
        <div className="revision-callout danger"><AlertTriangle size={16} /> One revision failed analysis. Open its report to retry before relying on this comparison.</div>
      )}

      <section className="revision-summary" aria-label="Revision summary">
        <article><span>Modified sheets</span><strong>{summary.modified}</strong><small>Metadata changed</small></article>
        <article><span>Added / removed</span><strong>{summary.added} <i>/</i> {summary.removed}</strong><small>Set composition</small></article>
        <article><span>New findings</span><strong>{findingSummary.new}</strong><small>{comparison.findings.status === 'READY' ? 'Needs review' : 'Analysis pending'}</small></article>
        <article><span>Resolved / persisting</span><strong>{findingSummary.resolved} <i>/</i> {findingSummary.persisting}</strong><small>Verify before sign-off</small></article>
      </section>

      <section className="revision-method-note">
        <GitCompareArrows size={18} />
        <div><strong>What this comparison proves</strong><p>{comparison.method.sheets}. {comparison.method.limitation}</p></div>
      </section>

      <section className="revision-workspace">
        <aside className="revision-sheet-index">
          <div className="revision-section-heading"><div><span className="section-eyebrow">Matched set</span><h2>Sheet changes</h2></div><b>{comparison.sheets.changes.length}</b></div>
          <div className="revision-filters" aria-label="Filter sheet changes">
            {FILTERS.map((item) => (
              <button type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item === 'ALL' ? 'All' : item.toLowerCase()}</button>
            ))}
          </div>
          <div className="revision-sheet-list">
            {visibleSheets.length === 0 ? <p className="revision-no-results">No sheets match this filter.</p> : visibleSheets.map((change) => {
              const Icon = statusIcon[change.status]
              const sheet = change.current || change.previous
              return (
                <button type="button" className={`revision-sheet-row ${selectedSheet?.key === change.key ? 'active' : ''}`} onClick={() => setSelectedKey(change.key)} key={change.key}>
                  <Icon size={16} /><span><strong>{sheet.sheetNumber || `Page ${sheet.pageNumber}`}</strong><small>{sheet.title || 'Untitled sheet'}</small></span><b className={change.status.toLowerCase()}>{change.status}</b>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="revision-evidence-workspace">
          {selectedSheet ? (
            <>
              <div className="revision-change-heading">
                <div><span className="section-eyebrow">Selected evidence</span><h2>{selectedSheet.current?.sheetNumber || selectedSheet.previous?.sheetNumber || 'Unnumbered sheet'}</h2></div>
                <span className={`revision-change-status ${selectedSheet.status.toLowerCase()}`}>{selectedSheet.status}</span>
              </div>
              {selectedSheet.changedFields.length > 0 && (
                <div className="revision-field-deltas">
                  {selectedSheet.changedFields.map((field) => (
                    <div key={field.field}><span>{FIELD_LABELS[field.field] || field.field}</span><del>{field.previous || 'Empty'}</del><ArrowRight size={12} /><ins>{field.current || 'Empty'}</ins></div>
                  ))}
                </div>
              )}
              <div className="revision-evidence-grid">
                <SheetEvidence label="Previous issue" drawing={comparison.previous} sheet={selectedSheet.previous} emptyMessage="This sheet did not exist in the previous issue." />
                <SheetEvidence label="Current issue" drawing={comparison.current} sheet={selectedSheet.current} emptyMessage="This sheet is no longer present in the current issue." />
              </div>
            </>
          ) : <div className="revision-empty-workspace"><Layers3 size={24} /><p>No sheet evidence is available to compare yet.</p></div>}
        </div>
      </section>

      <section className="revision-findings-section">
        <div className="revision-section-heading"><div><span className="section-eyebrow">Review delta</span><h2>Finding changes</h2><p>Exact finding identities are matched by category, title, and sheet.</p></div></div>
        {comparison.findings.status !== 'READY' ? (
          <div className={`revision-callout ${comparison.findings.status === 'FAILED' ? 'danger' : 'processing'}`}>
            {comparison.findings.status === 'FAILED' ? <AlertTriangle size={16} /> : <Clock3 size={16} />}
            {comparison.findings.status === 'FAILED'
              ? 'Finding comparison is unavailable because an analysis failed. Retry it from the drawing report.'
              : comparison.findings.status === 'INSUFFICIENT_EVIDENCE'
                ? 'Finding comparison needs a completed submission-readiness analysis for both revisions.'
                : 'Finding comparison will appear when both submission-readiness analyses are complete.'}
          </div>
        ) : (
          <div className="revision-finding-grid">
            <FindingGroup status="NEW" items={findingsByStatus.NEW} />
            <FindingGroup status="RESOLVED" items={findingsByStatus.RESOLVED} />
            <FindingGroup status="PERSISTING" items={findingsByStatus.PERSISTING} />
          </div>
        )}
      </section>
    </div>
  )
}
