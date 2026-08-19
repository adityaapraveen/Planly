import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  Database,
  ArrowUpRight,
  CheckCircle2,
  Search,
  ShieldCheck,
  Sparkles,
  RefreshCcw,
} from 'lucide-react'
import {
  askProjectQuestion,
  getEvidenceIndexStatus,
  getProjectChecks,
  getProjectQuestions,
  searchProjectEvidence,
  syncEvidenceIndex,
  updateProjectCheck,
} from '../../services/project.service'
import { Button } from '../ui/Button'

const statusLabels = {
  PASS: 'Passing',
  FAIL: 'Needs attention',
  DISABLED: 'Disabled',
  NOT_READY: 'Not ready',
}

function locationLabel(evidence) {
  if (!evidence.location) return `Page ${evidence.pageNumber}`
  const x = Math.round(Number(evidence.location.x || 0) * 100)
  const y = Math.round(Number(evidence.location.y || 0) * 100)
  return `Page ${evidence.pageNumber} · region ${x}%, ${y}%`
}

function EvidenceLink({ evidence, compact = false }) {
  return (
    <Link
      className={`project-evidence ${compact ? 'compact' : ''}`}
      to={`/drawings/${evidence.drawingId}/report`}
    >
      <div>
        <span>{evidence.type || 'CHECK EVIDENCE'}</span>
        <strong>{evidence.title || evidence.message}</strong>
        {!compact && <p>{evidence.snippet}</p>}
        <small>
          {evidence.sheetNumber ? `${evidence.sheetNumber} · ` : ''}
          {locationLabel(evidence)} · {evidence.drawingName}
        </small>
        {!compact && evidence.retrieval?.reasons?.length > 0 && (
          <em className="evidence-retrieval-reason">
            {evidence.retrieval.mode === 'HYBRID' ? 'Hybrid match' : 'Keyword match'} · {evidence.retrieval.reasons.join(' · ')}
          </em>
        )}
      </div>
      <ArrowUpRight size={15} />
    </Link>
  )
}

function AnswerCard({ answer }) {
  const trace = answer.retrievalTrace
  return (
    <article className={`project-answer ${answer.status.toLowerCase()}`}>
      <div className="project-answer-heading">
        <div>
          <span>{answer.status === 'ANSWERED' ? 'Cited answer' : 'Insufficient evidence'}</span>
          <h4>{answer.question}</h4>
        </div>
        <small>{Math.round(Number(answer.confidence || 0) * 100)}% confidence</small>
      </div>
      <p>{answer.answer}</p>
      {answer.citations?.length > 0 && (
        <div className="project-evidence-list">
          {answer.citations.map((citation) => (
            <EvidenceLink key={citation.id} evidence={citation} compact />
          ))}
        </div>
      )}
      {trace && (
        <details className="answer-retrieval-trace">
          <summary>
            <span>{answer.retrievalMode === 'HYBRID' ? 'Hybrid RAG' : 'Lexical retrieval'}</span>
            <small>{trace.candidateCount} candidates · {trace.returnedCount} context items</small>
          </summary>
          <div>
            <p>Trace <code>{trace.version}</code>. The answer model received only the ranked context listed below.</p>
            {(trace.topCandidates || []).slice(0, 5).map((candidate) => (
              <span key={candidate.id}>
                #{candidate.rank} {candidate.id}
                {candidate.semanticScore !== null && candidate.semanticScore !== undefined
                  ? ` · ${Math.round(candidate.semanticScore * 100)}% semantic`
                  : ` · lexical ${candidate.lexicalScore}`}
              </span>
            ))}
            {trace.semanticFallbackReason && <p>Fallback: {trace.semanticFallbackReason}</p>}
          </div>
        </details>
      )}
    </article>
  )
}

export function ProjectIntelligence({ projectId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchRan, setSearchRan] = useState(false)
  const [question, setQuestion] = useState('')
  const [questions, setQuestions] = useState([])
  const [asking, setAsking] = useState(false)
  const [checkReport, setCheckReport] = useState(null)
  const [updatingCheck, setUpdatingCheck] = useState('')
  const [error, setError] = useState('')
  const [loadingWorkspace, setLoadingWorkspace] = useState(true)
  const [indexStatus, setIndexStatus] = useState(null)
  const [syncingIndex, setSyncingIndex] = useState(false)
  const [searchTrace, setSearchTrace] = useState(null)

  useEffect(() => {
    let active = true

    async function loadWorkspace() {
      try {
        const [questionResponse, checkResponse, indexResponse] = await Promise.all([
          getProjectQuestions(projectId),
          getProjectChecks(projectId),
          getEvidenceIndexStatus(projectId),
        ])
        if (!active) return
        setQuestions(questionResponse.data?.questions || [])
        setCheckReport(checkResponse.data?.report || null)
        setIndexStatus(indexResponse.data?.index || null)
      } catch (err) {
        if (active) setError(err.message || 'Failed to load project intelligence')
      } finally {
        if (active) setLoadingWorkspace(false)
      }
    }

    loadWorkspace()
    return () => {
      active = false
    }
  }, [projectId])

  const handleSearch = async (event) => {
    event.preventDefault()
    if (searchQuery.trim().length < 2) return
    try {
      setSearching(true)
      setSearchRan(true)
      setError('')
      const response = await searchProjectEvidence(projectId, searchQuery.trim())
      setSearchResults(response.data?.results || [])
      if (response.data?.index) setIndexStatus(response.data.index)
      setSearchTrace(response.data?.retrieval || null)
    } catch (err) {
      setError(err.message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleSyncIndex = async () => {
    try {
      setSyncingIndex(true)
      setError('')
      const response = await syncEvidenceIndex(projectId)
      setIndexStatus(response.data?.index || null)
    } catch (err) {
      setError(err.message || 'Could not refresh project context')
    } finally {
      setSyncingIndex(false)
    }
  }

  const handleAsk = async (event) => {
    event.preventDefault()
    if (question.trim().length < 3) return
    try {
      setAsking(true)
      setError('')
      const response = await askProjectQuestion(projectId, question.trim())
      const answer = response.data?.answer
      if (answer) setQuestions((current) => [answer, ...current].slice(0, 20))
      setQuestion('')
    } catch (err) {
      setError(err.message || 'Could not answer this question')
    } finally {
      setAsking(false)
    }
  }

  const handleCheckUpdate = async (checkKey, changes) => {
    try {
      setUpdatingCheck(checkKey)
      setError('')
      const response = await updateProjectCheck(projectId, checkKey, changes)
      setCheckReport(response.data?.report || null)
    } catch (err) {
      setError(err.message || 'Could not update project check')
    } finally {
      setUpdatingCheck('')
    }
  }

  const indexTone = indexStatus?.status === 'STALE'
    ? 'stale'
    : (indexStatus?.semantic?.status || 'empty').toLowerCase()

  return (
    <section className="project-intelligence-section">
      <div className="project-intelligence-title">
        <div className="project-intelligence-icon"><Sparkles size={20} /></div>
        <div>
          <span>Architectural Intelligence</span>
          <h2>Search, ask, and enforce project checks</h2>
          <p>Answers use indexed project evidence only. Every supported answer includes a sheet and page citation.</p>
        </div>
        <div className="intelligence-trust-badge"><ShieldCheck size={14} /> Project-scoped</div>
      </div>

      {error && (
        <div className="project-intelligence-error">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {loadingWorkspace && (
        <div className="intelligence-loading" role="status" aria-live="polite">
          <span className="intelligence-loading-pulse" />
          <div><strong>Connecting project evidence</strong><p>Loading cited questions and deterministic checks…</p></div>
        </div>
      )}

      {!loadingWorkspace && (
        <div className={`intelligence-index-strip ${indexTone}`}>
          <div className="intelligence-index-icon"><Database size={17} /></div>
          <div className="intelligence-index-copy">
            <div>
              <strong>Project context index</strong>
              <span className={`retrieval-mode-badge ${(indexStatus?.retrievalMode || 'LEXICAL').toLowerCase()}`}>
                {indexStatus?.retrievalMode === 'HYBRID' ? 'Hybrid RAG' : 'Lexical fallback'}
              </span>
            </div>
            <p>
              {indexStatus?.indexedEvidence || 0} of {indexStatus?.sourceEvidence || 0} evidence chunks indexed · {indexStatus?.embeddedEvidence || 0} semantic vectors
              {indexStatus?.staleEvidence > 0 ? ` · ${indexStatus.staleEvidence} updates pending` : ''}
              {indexStatus?.semantic?.reason ? ` · ${indexStatus.semantic.reason}` : ''}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleSyncIndex} disabled={syncingIndex}>
            <RefreshCcw size={13} className={syncingIndex ? 'spin-icon' : ''} />
            {syncingIndex ? 'Indexing…' : 'Refresh context'}
          </Button>
        </div>
      )}

      <div className={`project-intelligence-grid ${loadingWorkspace ? 'is-loading' : ''}`}>
        <div className="project-intelligence-card">
          <div className="intelligence-card-heading">
            <Search size={18} />
            <div><h3>Project evidence search</h3><p>Sheets, findings, and callouts</p></div>
          </div>
          <form className="intelligence-input-row" onSubmit={handleSearch}>
            <input
              aria-label="Search project evidence"
              value={searchQuery}
              maxLength={500}
              placeholder="Search A501, accessibility, missing target…"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Button type="submit" disabled={searching || searchQuery.trim().length < 2}>
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </form>
          {searchTrace && (
            <div className="search-retrieval-summary">
              <span>{searchTrace.mode === 'HYBRID' ? 'Semantic + keyword retrieval' : 'Keyword retrieval'}</span>
              <small>{searchTrace.candidateCount} candidates ranked · trace {searchTrace.version}</small>
            </div>
          )}
          {searchRan && searchResults.length === 0 ? (
            <p className="intelligence-empty">No indexed project evidence matched this search.</p>
          ) : (
            <div className="project-evidence-list search-results">
              {searchResults.map((result) => <EvidenceLink key={result.id} evidence={result} />)}
            </div>
          )}
        </div>

        <div className="project-intelligence-card">
          <div className="intelligence-card-heading">
            <Sparkles size={18} />
            <div><h3>Ask the drawing set</h3><p>Grounded answers, never model memory</p></div>
          </div>
          <form className="intelligence-question-form" onSubmit={handleAsk}>
            <textarea
              aria-label="Ask a question about this drawing set"
              value={question}
              maxLength={1000}
              rows={3}
              placeholder="Which sheets contain unresolved coordination findings?"
              onChange={(event) => setQuestion(event.target.value)}
            />
            <Button type="submit" disabled={asking || question.trim().length < 3}>
              {asking ? 'Reviewing evidence…' : 'Ask with citations'}
            </Button>
          </form>
          <div className="project-answer-list">
            {questions.length === 0
              ? <p className="intelligence-empty">No project questions asked yet.</p>
              : questions.map((answer) => <AnswerCard key={answer.id} answer={answer} />)}
          </div>
        </div>
      </div>

      <div className="project-intelligence-card check-library-card">
        <div className="intelligence-card-heading check-heading">
          <ShieldCheck size={18} />
          <div>
            <h3>Project check library</h3>
            <p>Versioned deterministic rules evaluated against the current drawing data</p>
          </div>
          {checkReport?.summary && (
            <div className="check-summary">
              <span><CheckCircle2 size={13} /> {checkReport.summary.passing} passing</span>
              <span>{checkReport.summary.failing} failing</span>
              <span>{checkReport.summary.findings} findings</span>
            </div>
          )}
        </div>

        <div className="project-check-list">
          {(checkReport?.checks || []).map((check) => (
            <details className={`project-check ${check.status.toLowerCase()}`} key={check.key}>
              <summary>
                <div className="check-primary">
                  <input
                    type="checkbox"
                    checked={check.enabled}
                    disabled={updatingCheck === check.key}
                    aria-label={`Enable ${check.title}`}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => handleCheckUpdate(check.key, { enabled: event.target.checked })}
                  />
                  <div>
                    <strong>{check.title}</strong>
                    <p>{check.purpose}</p>
                  </div>
                </div>
                <div className="check-controls">
                  <select
                    value={check.severity}
                    disabled={updatingCheck === check.key}
                    aria-label={`${check.title} severity`}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => handleCheckUpdate(check.key, { severity: event.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <span className={`check-status ${check.status.toLowerCase()}`}>
                    {statusLabels[check.status]}{check.findingCount > 0 ? ` · ${check.findingCount}` : ''}
                  </span>
                  <small>{check.version}</small>
                </div>
              </summary>
              <div className="check-detail">
                <p><strong>Scope:</strong> {check.scope}</p>
                <p><strong>Expected evidence:</strong> {check.expectedEvidence}</p>
                <p><strong>Exclusions:</strong> {check.exclusions}</p>
                {check.findings.length > 0 && (
                  <div className="project-evidence-list">
                    {check.findings.map((finding) => (
                      <EvidenceLink key={`${check.key}-${finding.id}`} evidence={finding} compact />
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
