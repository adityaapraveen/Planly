import { useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { Button } from '../ui/Button'

const FIELDS = [
  { key: 'sheetNumber', label: 'Sheet number', placeholder: 'A101' },
  { key: 'title', label: 'Sheet title', placeholder: 'Floor plan' },
  { key: 'discipline', label: 'Discipline', placeholder: 'Architectural' },
  { key: 'revision', label: 'Revision', placeholder: 'P2' },
  { key: 'issueDate', label: 'Issue date', placeholder: 'As printed' },
]

const editableValues = (sheet) => Object.fromEntries(
  FIELDS.map(({ key }) => [key, sheet[key] || '']),
)

function formatConfidence(value) {
  const confidence = Number(value)
  if (!Number.isFinite(confidence)) return '—'
  return `${Math.round(confidence * 100)}%`
}

function SheetRow({ sheet, saving, onSave, onConfirm }) {
  const [values, setValues] = useState(() => editableValues(sheet))
  const [showEvidence, setShowEvidence] = useState(false)

  const changes = useMemo(() => Object.fromEntries(
    FIELDS
      .filter(({ key }) => values[key] !== (sheet[key] || ''))
      .map(({ key }) => [key, values[key] || null]),
  ), [sheet, values])
  const hasChanges = Object.keys(changes).length > 0
  const reviewed = ['CORRECTED', 'CONFIRMED'].includes(sheet.reviewStatus)

  return (
    <article className="sheet-index-row">
      <div className="sheet-index-row-head">
        <div>
          <strong>PDF page {sheet.pageNumber}</strong>
          <span className={`sheet-review-status ${sheet.reviewStatus.toLowerCase()}`}>
            {sheet.reviewStatus.replaceAll('_', ' ')}
          </span>
        </div>
        <span className="sheet-overall-confidence">
          AI confidence {formatConfidence(sheet.confidence)}
        </span>
      </div>

      <div className="sheet-metadata-grid">
        {FIELDS.map(({ key, label, placeholder }) => (
          <label className="sheet-metadata-field" key={key}>
            <span>
              {label}
              <small>{formatConfidence(sheet.fieldConfidence?.[key])}</small>
            </span>
            <input
              value={values[key]}
              placeholder={placeholder}
              maxLength={500}
              onChange={(event) => setValues((current) => ({
                ...current,
                [key]: event.target.value,
              }))}
            />
          </label>
        ))}
      </div>

      <div className="sheet-index-row-actions">
        <button
          type="button"
          className="sheet-evidence-toggle"
          onClick={() => setShowEvidence((current) => !current)}
        >
          {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showEvidence ? 'Hide AI evidence' : 'Show AI evidence'}
        </button>
        <div>
          {!reviewed && !hasChanges && (
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => onConfirm(sheet.id)}
            >
              <Check size={14} /> Confirm
            </Button>
          )}
          <Button
            disabled={!hasChanges || saving}
            onClick={() => onSave(sheet.id, changes)}
          >
            <Save size={14} /> {saving ? 'Saving…' : 'Save corrections'}
          </Button>
        </div>
      </div>

      {showEvidence && (
        <div className="sheet-evidence-grid">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <strong>{label}</strong>
              <p>{sheet.evidence?.[key] || 'No extraction evidence recorded.'}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function SheetIndex({ sheetIndex, analysisStatus, savingSheetId, onSave, onConfirm }) {
  const [expanded, setExpanded] = useState(true)
  const sheets = sheetIndex?.sheets || []
  const diagnostics = sheetIndex?.diagnostics || []
  const summary = sheetIndex?.summary || {}

  return (
    <section className="sheet-index-card">
      <button
        type="button"
        className="sheet-index-heading"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <div>
          <span className="sheet-index-eyebrow">Drawing-set intelligence</span>
          <h2>Sheet index</h2>
          <p>
            {sheets.length > 0
              ? `${summary.indexedSheets || sheets.length} indexed · ${summary.needsReview || 0} need review`
              : analysisStatus === 'PENDING' || analysisStatus === 'PROCESSING'
                ? 'Metadata will appear as soon as this analysis finishes.'
                : 'Run an analysis to extract sheet metadata.'}
          </p>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="sheet-index-content">
          {diagnostics.length > 0 && (
            <div className="sheet-diagnostics" aria-label="Sheet index warnings">
              {diagnostics.map((diagnostic) => (
                <div className={`sheet-diagnostic ${diagnostic.severity}`} key={`${diagnostic.code}-${diagnostic.sheetIds.join('-')}`}>
                  <AlertTriangle size={15} />
                  <span>{diagnostic.message}</span>
                </div>
              ))}
            </div>
          )}

          {sheets.length === 0 ? (
            <p className="sheet-index-empty">
              Sheet metadata has not been extracted for this drawing yet.
            </p>
          ) : sheets.map((sheet) => (
            <SheetRow
              key={`${sheet.id}-${sheet.updatedAt}`}
              sheet={sheet}
              saving={savingSheetId === sheet.id}
              onSave={onSave}
              onConfirm={onConfirm}
            />
          ))}
        </div>
      )}
    </section>
  )
}
