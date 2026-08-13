import { useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LocateFixed,
} from 'lucide-react'

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'MISSING_TARGET', label: 'Missing' },
  { value: 'AMBIGUOUS_TARGET', label: 'Ambiguous' },
  { value: 'LOW_CONFIDENCE', label: 'Needs review' },
  { value: 'RESOLVED', label: 'Resolved' },
]

const statusLabels = {
  RESOLVED: 'Resolved',
  MISSING_TARGET: 'Missing target',
  AMBIGUOUS_TARGET: 'Ambiguous target',
  LOW_CONFIDENCE: 'Needs review',
}

function sheetLabel(sheetNumber, pageNumber) {
  return sheetNumber || `PDF page ${pageNumber}`
}

export function ReferenceGraph({ graph, selectedReferenceId, onSelectReference }) {
  const [expanded, setExpanded] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const references = graph?.references || []
  const summary = graph?.summary || {}
  const filteredReferences = references.filter((reference) =>
    filter === 'ALL' || reference.resolutionStatus === filter
  )
  const problems = (summary.missing || 0) + (summary.ambiguous || 0)

  return (
    <section className="reference-graph-card">
      <button
        type="button"
        className="reference-graph-heading"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <div>
          <span className="sheet-index-eyebrow">Sheet graph</span>
          <h2>Cross-sheet references</h2>
          <p>
            {references.length > 0
              ? `${summary.total || references.length} references · ${problems} broken or ambiguous`
              : 'No explicit cross-sheet callouts have been indexed yet.'}
          </p>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="reference-graph-content">
          <div className="reference-summary" aria-label="Reference graph summary">
            <span><CheckCircle2 size={14} /> {summary.resolved || 0} resolved</span>
            <span><AlertTriangle size={14} /> {summary.missing || 0} missing</span>
            <span><AlertTriangle size={14} /> {summary.ambiguous || 0} ambiguous</span>
            <span>{summary.lowConfidence || 0} need review</span>
          </div>

          <div className="reference-filters" aria-label="Filter references">
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item.value}
                className={filter === item.value ? 'active' : ''}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredReferences.length === 0 ? (
            <p className="sheet-index-empty">
              {references.length === 0
                ? 'Run an analysis to extract visible detail, section, elevation, plan, and schedule references.'
                : 'No references match this filter.'}
            </p>
          ) : (
            <div className="reference-list">
              {filteredReferences.map((reference) => (
                <button
                  type="button"
                  key={reference.id}
                  className={`reference-row ${reference.resolutionStatus.toLowerCase()} ${selectedReferenceId === reference.id ? 'active' : ''}`}
                  onClick={() => onSelectReference(reference)}
                >
                  <div className="reference-route">
                    <strong>{sheetLabel(reference.source.sheetNumber, reference.source.pageNumber)}</strong>
                    <ArrowRight size={14} />
                    <strong>{reference.targetSheetNumber}</strong>
                    <span>{reference.referenceType}</span>
                  </div>
                  <div className="reference-row-detail">
                    <div>
                      <strong>{reference.label}</strong>
                      <p>{reference.evidence}</p>
                    </div>
                    <div>
                      <span className={`reference-status ${reference.resolutionStatus.toLowerCase()}`}>
                        {statusLabels[reference.resolutionStatus] || reference.resolutionStatus}
                      </span>
                      <small>{Math.round(reference.confidence * 100)}% confidence</small>
                      {reference.hasLocation && (
                        <span className="reference-locate"><LocateFixed size={13} /> Locate</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
