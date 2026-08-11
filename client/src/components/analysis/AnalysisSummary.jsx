export function AnalysisSummary({ analysis, issues }) {
  const score = Number(analysis?.score || 0)
  const high = issues.filter((i) => String(i.severity || '').toLowerCase() === 'high').length
  const medium = issues.filter((i) => String(i.severity || '').toLowerCase() === 'medium').length
  const low = issues.filter((i) => String(i.severity || '').toLowerCase() === 'low').length

  return (
    <div className="analysis-summary-grid">
      <div className="analysis-summary-card score">
        <div className="label">Review Readiness Score</div>
        <div className="value">{score}</div>
      </div>
      <div className="analysis-summary-card">
        <div className="label">Total Issues</div>
        <div className="value">{issues.length}</div>
      </div>
      <div className="analysis-summary-card">
        <div className="label">Severity Split</div>
        <div className="value small">H {high} · M {medium} · L {low}</div>
      </div>
      <div className="analysis-summary-card summary">
        <div className="label">AI Summary</div>
        <p>{analysis?.summary || 'No summary generated yet.'}</p>
        <p className="analysis-disclaimer">AI-assisted review only. A qualified professional must verify all findings.</p>
      </div>
    </div>
  )
}
