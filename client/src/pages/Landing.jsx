import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileSearch,
  Layers3,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './Landing.css'

const capabilities = [
  {
    number: '01',
    icon: Layers3,
    title: 'Understand the drawing set',
    description: 'Build a project-level sheet index and follow references across files before reviewing individual pages.',
  },
  {
    number: '02',
    icon: FileSearch,
    title: 'Inspect every finding',
    description: 'Move from an issue to its source page, location, confidence, and supporting evidence without losing context.',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Keep humans in control',
    description: 'Confirm metadata, change finding status, and preserve reviewer decisions when analysis is rerun.',
  },
]

export function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="landing">
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} aria-label="Primary navigation">
        <Link to="/" className="landing-brand" aria-label="Planly home">
          <span className="landing-brand-mark"><ScanSearch size={18} /></span>
          <span>Planly</span>
        </Link>
        <div className="landing-nav-links">
          <Link className="landing-link" to="/login">Sign in</Link>
          <Link className="landing-button landing-button-small" to="/register">
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-eyebrow"><CircleDot size={13} /> Architectural intelligence workspace</div>
            <h1>Review drawing sets with <span>evidence, not guesswork.</span></h1>
            <p>
              Planly turns architectural PDFs into an inspectable project workspace—connecting sheets,
              surfacing review risks, and keeping every AI-assisted finding tied to its source.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-button" to="/register">Create your workspace <ArrowRight size={16} /></Link>
              <a className="landing-button landing-button-secondary" href="#workflow">See the workflow</a>
            </div>
            <div className="landing-trust-row">
              <span><CheckCircle2 size={15} /> Source-linked findings</span>
              <span><CheckCircle2 size={15} /> Human review trail</span>
              <span><CheckCircle2 size={15} /> Multiple review modes</span>
            </div>
          </div>

          <div className="product-preview" aria-label="Planly drawing review workspace preview">
            <div className="preview-window-bar">
              <div className="preview-window-dots"><i /><i /><i /></div>
              <span>Drawing review workspace</span>
              <span className="preview-status"><i /> Evidence ready</span>
            </div>
            <div className="preview-shell">
              <aside className="preview-sidebar">
                <div className="preview-logo"><ScanSearch size={15} /> Planly</div>
                <span className="preview-label">Workspace</span>
                <div className="preview-nav-item"><span /> Overview</div>
                <div className="preview-nav-item active"><span /> Drawings</div>
                <div className="preview-nav-item"><span /> Decisions</div>
              </aside>
              <div className="preview-main">
                <div className="preview-topline">
                  <div><small>PROJECT / DRAWING SET</small><strong>North elevation review</strong></div>
                  <span className="preview-mode">Submission readiness</span>
                </div>
                <div className="preview-content">
                  <div className="preview-drawing">
                    <span className="preview-sheet-tag">A-201 · North elevation</span>
                    <div className="drawing-line line-a" />
                    <div className="drawing-line line-b" />
                    <div className="drawing-line line-c" />
                    <div className="drawing-line line-d" />
                    <div className="drawing-grid-block grid-one" />
                    <div className="drawing-grid-block grid-two" />
                    <div className="preview-pin pin-one">01</div>
                    <div className="preview-pin pin-two">02</div>
                  </div>
                  <aside className="preview-findings">
                    <div className="preview-findings-head"><span>Review findings</span><b>2 open</b></div>
                    <article className="preview-finding active">
                      <div><span className="severity warning">Medium</span><small>A-201 · Detail 4</small></div>
                      <strong>Referenced head detail needs review</strong>
                      <p>Source and target notation do not resolve to the same detail.</p>
                      <span className="preview-source"><FileSearch size={12} /> View source evidence <ChevronRight size={12} /></span>
                    </article>
                    <article className="preview-finding">
                      <div><span className="severity info">Review</span><small>A-601 · Door schedule</small></div>
                      <strong>Door tag is missing schedule data</strong>
                    </article>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-proof" aria-label="Product principles">
          <p>Designed for the handoff between drawing coordination, technical QA, and human approval.</p>
          <div><span>Project context</span><i /><span>Traceable evidence</span><i /><span>Review decisions</span></div>
        </section>

        <section className="landing-workflow" id="workflow">
          <div className="landing-section-heading">
            <span className="landing-eyebrow"><Sparkles size={13} /> One connected review flow</span>
            <h2>From a folder of PDFs to a reviewable decision.</h2>
            <p>Planly keeps the source material, machine assistance, and reviewer judgment in the same workspace.</p>
          </div>
          <div className="landing-capability-grid">
            {capabilities.map(({ number, icon: Icon, title, description }) => (
              <article className="landing-capability" key={number}>
                <div className="landing-capability-top"><span>{number}</span><Icon size={20} /></div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-evidence-section">
          <div className="landing-evidence-copy">
            <span className="landing-eyebrow"><FileSearch size={13} /> Built for inspectability</span>
            <h2>AI assistance that shows its work.</h2>
            <p>
              Planly does not hide uncertainty behind a score. Reviewers can inspect sheet metadata,
              cross-sheet references, pinpointed findings, and the scope of every analysis.
            </p>
            <ul>
              <li><CheckCircle2 size={16} /> Findings stay linked to sheet and page evidence</li>
              <li><CheckCircle2 size={16} /> Missing or ambiguous references remain visible</li>
              <li><CheckCircle2 size={16} /> Human corrections survive future analysis runs</li>
            </ul>
          </div>
          <div className="evidence-card-stack">
            <div className="evidence-card-label">EVIDENCE CHAIN</div>
            <article className="evidence-card">
              <div className="evidence-icon"><Layers3 size={18} /></div>
              <div><span>Source sheet</span><strong>A-201 · North elevation</strong><small>Page 12 · Callout 4/A-501</small></div>
              <ChevronRight size={16} />
            </article>
            <article className="evidence-card">
              <div className="evidence-icon blue"><FileSearch size={18} /></div>
              <div><span>Resolved target</span><strong>A-501 · Wall details</strong><small>Detail 4 · Reviewer confirmation pending</small></div>
              <ChevronRight size={16} />
            </article>
            <div className="evidence-note"><ShieldCheck size={16} /> AI-assisted · Project drawing set · Source cited</div>
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <span className="landing-eyebrow">Start with one drawing set</span>
            <h2>Make the next review easier to trust.</h2>
          </div>
          <Link className="landing-button landing-button-light" to="/register">Create your workspace <ArrowRight size={16} /></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" className="landing-brand"><span className="landing-brand-mark"><ScanSearch size={17} /></span><span>Planly</span></Link>
        <p>Architectural intelligence with inspectable evidence.</p>
        <span>© {new Date().getFullYear()} Planly</span>
      </footer>
    </div>
  )
}
