import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, WandSparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { apiFetch } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { buildFloorPlan, parsePlanPrompt, floorPlanDxf, selectPlanFloor, floorPlanSvg, floorPlanScheduleCsv } from '../../../shared/floor-plan.mjs'
import './PlanStudio.css'

const examples = ['A single-floor 2 bedroom house with 1 bathroom on a 30 x 40 ft plot.',
  'A single-floor 3 bedroom house with 2 bathrooms, an office, utility and parking on an 18 x 24 m plot.',
  'A 2 floor house with 4 bedrooms, 3 bathrooms, a study and parking on an 18 x 24 m plot.']

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function PlanStudio({ demo = false }) {
  const { isAuthenticated } = useAuth()
  const [prompt, setPrompt] = useState(examples[0])
  const [mode, setMode] = useState(demo ? 'local' : 'ai')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState('')
  const [floorId, setFloorId] = useState('all')
  const [dxfVersion, setDxfVersion] = useState('R2000')
  const [exportUnits, setExportUnits] = useState('mm')
  const generate = async event => {
    event.preventDefault(); setBusy(true); setError(''); setResult(null); setSelected(null); setFloorId('all')
    try {
      if (mode === 'ai' && !isAuthenticated) throw new Error('Sign in to the workspace to use the configured AI provider.')
      const data = mode === 'local'
        ? { plan: buildFloorPlan(parsePlanPrompt(prompt)), mode: 'Local constrained template' }
        : (await apiFetch('/api/plans/generate', { method: 'POST', body: { prompt } })).data
      setResult(data); setSubmitted(prompt)
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const fullPlan = result?.plan
  const plan = fullPlan ? selectPlanFloor(fullPlan, floorId) : null
  const currentRoom = plan?.rooms.find(room => room.id === selected)
  const stale = Boolean(plan && submitted !== prompt)
  return <div className={`plan-studio ${demo ? 'plan-demo' : ''}`}>
    <header className="plan-heading"><div><p className="plan-eyebrow">PLANLY / CONCEPT LAB</p>
      <h1>Prompt to floor plan</h1><p>Create a schematic layout, inspect the assumptions, and open an editable drawing in LibreCAD.</p></div>
      {demo && <Link to="/login">Open workspace</Link>}</header>
    <p className="plan-notice">Concept demo · rectangular homes with 1–3 floors · professional review required before use.</p>
    <div className="plan-studio-grid">
      <section className="plan-controls"><form onSubmit={generate}>
        <label htmlFor="plan-prompt">Describe your home</label>
        <textarea id="plan-prompt" value={prompt} onChange={event => setPrompt(event.target.value)} maxLength={2000} rows={6} required disabled={busy} />
        <p className="plan-muted">Include plot size, ft or m, total bedrooms/bathrooms, and floor count. Add study, utility or parking. Preview geometry uses metres.</p>
        <label htmlFor="plan-mode">Generation mode</label>
        <select id="plan-mode" value={mode} onChange={event => setMode(event.target.value)} disabled={busy}>
          <option value="local">Local demo — no AI request</option>
          <option value="ai">AI layout — validated geometry</option>
        </select>
        {mode === 'ai' && <p className="plan-muted">AI proposes room order, sides, depths and corridor position. Geometry checks reject invalid proposals; up to two correction attempts are allowed. Your prompt is sent to the backend-configured provider.{!isAuthenticated && <> <Link to="/login">Sign in</Link>, then open <Link to="/plan-studio">Plan Studio</Link> to generate with AI.</>}</p>}
        <p className="plan-muted">{mode === 'ai' ? 'AI layouts retain a rectangular envelope and full-depth corridor. Allow time for interpretation, design and corrections.' : 'Local mode uses the fixed corridor template.'} Stairs and furniture are schematic.</p>
        <Button type="submit" fullWidth disabled={busy}><WandSparkles size={16} />{busy ? 'Generating…' : 'Generate concept'}</Button>
        {error && <p className="plan-error" role="alert">{error}</p>}
      </form>
      <h2>Try a prompt</h2>{examples.map((example, index) => <button disabled={busy} className="plan-example" key={example} onClick={() => setPrompt(example)}>{['Compact two-bedroom', 'Home with office + parking', 'Two-floor family home'][index]}<span>{example}</span></button>)}
      <details><summary>CAD compatibility and import</summary><ol><li>Select R2000 DXF + millimetres for explicit unit metadata, or R12 for older readers.</li><li>Open the DXF in LibreCAD or AutoCAD. Use Auto Zoom / Zoom Extents.</li><li>Choose the same units as the export. A 0.9 m door is 900 drawing units in the mm file.</li><li>Revit / Archicad import this as 2D linework, not native BIM walls. Other applications require their own import verification.</li></ol><p>DXF support is not a guarantee of every application/version. DWG, RVT and IFC export are not included.</p><a href="https://librecad.org/" target="_blank" rel="noreferrer">Get free LibreCAD</a></details>
      </section>
      <section className="plan-output" aria-live="polite">
        {!plan ? <div className="plan-start"><h2>Your editable concept starts here</h2><p>Choose a sample or describe a plot. The generator checks fit and creates room zones, door openings, windows and labels.</p></div> : <>
          <div className="plan-output-heading"><div><h2>Concept floor plan</h2><p>{result.mode}{result.model ? ` · ${result.model}` : ''}</p></div>
            <Button variant="secondary" disabled={stale} onClick={() => download(floorPlanDxf(plan, { version: dxfVersion, units: exportUnits }), `planly-${floorId}-${dxfVersion}-${exportUnits}.dxf`, 'application/dxf')}><Download size={16} />DXF</Button></div>
          {result.layoutValidation && <p className="plan-notice">AI geometry validation passed · {result.layoutValidation.attempts} proposal attempt(s){result.layoutValidation.corrected ? ' · corrected after validation feedback' : ''}. Checked topology: full-depth corridor. Architectural compliance is not certified.</p>}
          <div className="plan-export-options"><label>View / export floor<select value={floorId} onChange={event => { setFloorId(event.target.value); setSelected(null) }}><option value="all">All floors side by side</option>{fullPlan.floors.map(floor => <option key={floor.id} value={floor.id}>{floor.name}</option>)}</select></label>
            <label>DXF version<select value={dxfVersion} onChange={event => setDxfVersion(event.target.value)}><option value="R2000">R2000 — explicit units</option><option value="R12">R12 — legacy exchange</option></select></label>
            <label>Export units<select value={exportUnits} onChange={event => setExportUnits(event.target.value)}><option value="mm">Millimetres</option><option value="m">Metres</option></select></label></div>
          {stale && <p className="plan-notice">The prompt changed. Generate again before exporting.</p>}
          <svg className="plan-preview" viewBox={`${plan.bounds.x} 0 ${plan.bounds.width} ${plan.bounds.height}`} role="img" aria-label="Schematic floor plans in metres, front entrance at the bottom">
            <g transform={`translate(0 ${plan.bounds.y + plan.bounds.height}) scale(1 -1)`}>
              {plan.rooms.map(room => <rect key={room.id} className={selected === room.id ? 'plan-room selected' : 'plan-room'} x={room.x} y={room.y} width={room.width} height={room.height} onClick={() => setSelected(room.id)} />)}
              {plan.lines.map((line, index) => <line key={index} className={`plan-line layer-${line.layer.toLowerCase()}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />)}
            </g>
            {plan.labels.map((label, index) => <text key={index} x={label.x} y={plan.bounds.y + plan.bounds.height - label.y} fontSize={label.height}>{label.text}</text>)}
          </svg>
          <p className="plan-muted">{currentRoom ? `${currentRoom.name}: ${currentRoom.width.toFixed(2)} × ${currentRoom.height.toFixed(2)} m · ${currentRoom.area.toFixed(1)} m² schematic area` : 'Select a room below to inspect its schematic dimensions.'}</p>
          <div className="plan-room-list">{plan.rooms.map(room => <button key={room.id} aria-pressed={selected === room.id} onClick={() => setSelected(room.id)}>{room.name}<span>{room.area.toFixed(1)} m²</span></button>)}</div>
          <div className="plan-facts"><section><h3>Geometry checks</h3><ul>{plan.checks.map(check => <li key={check}>{check}</li>)}</ul></section>
            <section><h3>Assumptions and limits</h3><ul>{plan.assumptions.map((note, index) => <li key={index}>{note}</li>)}</ul></section></div>
          <Button variant="ghost" disabled={stale} onClick={() => download(JSON.stringify({ ...result, prompt: submitted }, null, 2), 'planly-concept.json', 'application/json')}>Download geometry + assumptions</Button>
          <Button variant="ghost" disabled={stale} onClick={() => download(floorPlanSvg(plan), 'planly-concept.svg', 'image/svg+xml')}>SVG drawing</Button>
          <Button variant="ghost" disabled={stale} onClick={() => download(floorPlanScheduleCsv(plan), 'planly-door-schedule.csv', 'text/csv')}>Door schedule CSV</Button>
        </>}
      </section>
    </div>
  </div>
}
