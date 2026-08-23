export function AnalysisSummary({ analysis, issues }) {
  const score = Number(analysis?.score || 0)
  const high = issues.filter((issue) => String(issue.severity || '').toLowerCase() === 'high').length
  const medium = issues.filter((issue) => String(issue.severity || '').toLowerCase() === 'medium').length
  const low = issues.filter((issue) => String(issue.severity || '').toLowerCase() === 'low').length
  const decided = issues.filter((issue) => ['RESOLVED', 'DISMISSED'].includes(issue.status)).length

  return (
    <div className="analysis-summary-grid">
      <div className="analysis-summary-card score">
        <div className="label">Heuristic Review Signal</div>
        <div className="value">{score}<small>/100</small></div>
        <p>Severity-weighted triage aid—not a compliance or readiness score.</p>
      </div>
      <div className="analysis-summary-card">
        <div className="label">Human Review Coverage</div>
        <div className="value">{decided}<small>/{issues.length}</small></div>
      </div>
      <div className="analysis-summary-card">
        <div className="label">Advisory Findings</div>
        <div className="value small">H {high} · M {medium} · L {low}</div>
      </div>
      <div className="analysis-summary-card summary">
        <div className="label">AI-assisted summary</div>
        <p>{analysis?.summary || 'No summary generated yet.'}</p>
        <p className="analysis-disclaimer">Page-level advisory review only. A qualified professional must inspect the cited drawing evidence and record a decision.</p>
      </div>
    </div>
  )
}
