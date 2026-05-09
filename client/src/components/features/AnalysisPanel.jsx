import { AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import './AnalysisPanel.css'

function getScoreClass(score) {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-mid'
  return 'score-low'
}

function getScoreLabel(score) {
  if (score >= 70) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

function getIssueFields(issue) {
  if (!issue || typeof issue !== 'object') return null

  return [
    { label: 'Title', value: issue.title },
    { label: 'Category', value: issue.category },
    { label: 'Location', value: issue.location },
    { label: 'Severity', value: issue.severity },
    { label: 'Explanation', value: issue.explanation || issue.description || issue.message },
    { label: 'Recommendation', value: issue.recommendation || issue.fix || issue.suggestion },
  ].filter((field) => field.value !== undefined && field.value !== null && String(field.value).trim() !== '')
}

export function AnalysisPanel({ analysis, loading, error, onAnalyze }) {
  if (loading) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-header">
          <h3>AI Analysis</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner />
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="analysis-panel">
        <div className="analysis-panel-header">
          <h3>AI Analysis</h3>
        </div>
        <div className="analysis-empty">
          <p>No analysis available yet for this drawing.</p>
          {error && <p className="analysis-error">{error}</p>}
          {onAnalyze && (
            <Button onClick={onAnalyze}>
              <Sparkles size={16} />
              Run Analysis
            </Button>
          )}
        </div>
      </div>
    )
  }

  const issues = Array.isArray(analysis.issues) ? analysis.issues : []

  return (
    <div className="analysis-panel">
      <div className="analysis-panel-header">
        <h3>AI Analysis</h3>
      </div>

      <div className="analysis-score">
        <div className={`analysis-score-circle ${getScoreClass(analysis.score)}`}>
          {analysis.score}
        </div>
        <div className="analysis-score-detail">
          <h4>Compliance Score — {getScoreLabel(analysis.score)}</h4>
          <p>Based on automated review of the drawing contents</p>
        </div>
      </div>

      {analysis.summary && (
        <div className="analysis-summary">
          <h4>Summary</h4>
          <p>{analysis.summary}</p>
        </div>
      )}

      {issues.length > 0 && (
        <div className="analysis-issues">
          <h4>Issues ({issues.length})</h4>
          {issues.map((issue, i) => (
            <div key={i} className="analysis-issue">
              <span className="analysis-issue-icon">
                <AlertCircle size={14} />
              </span>
              {(() => {
                const fields = getIssueFields(issue)
                if (!fields) {
                  return <span>{String(issue)}</span>
                }

                return (
                  <span>
                    {fields.map((field, index) => (
                      <div key={`${field.label}-${index}`}>
                        <strong>{field.label}:</strong> {String(field.value)}
                      </div>
                    ))}
                  </span>
                )
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
