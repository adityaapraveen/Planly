import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, FileSearch, FolderKanban, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import './Landing.css'

const features = [
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Organize architectural drawings into projects. Track progress and manage your entire portfolio from one place.',
  },
  {
    icon: FileSearch,
    title: 'Drawing Upload & Review',
    description: 'Upload PDF drawings and get them indexed, tracked, and ready for automated compliance analysis.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Analysis',
    description: 'Leverage AI to automatically review drawings for compliance issues, scoring each submission with actionable feedback.',
  },
  {
    icon: Shield,
    title: 'Compliance Scoring',
    description: 'Every drawing receives a compliance score with a detailed breakdown of issues found during review.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Get analysis results in seconds, not days. Accelerate your review cycle and reduce manual overhead.',
  },
  {
    icon: BarChart3,
    title: 'Actionable Reports',
    description: 'Detailed issue reports with clear summaries help your team address problems before they become costly.',
  },
]

export function Landing() {
  const { isAuthenticated, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="landing">
      {/* Nav */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-brand">
          <span className="landing-nav-brand-mark">P</span>
          Planly
        </div>
        <div className="landing-nav-links">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">
              <span>Get started</span>
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-pill">
          <span className="landing-hero-pill-dot" />
          Now in beta — free during early access
        </div>
        <h1>
          Architectural plan intelligence,{' '}
          <span>automated</span>
        </h1>
        <p className="landing-hero-subtitle">
          Upload architectural drawings, get instant AI-powered compliance reviews, and manage your entire project portfolio — all in one place.
        </p>
        <div className="landing-hero-actions">
          <Link to="/register">
            <Button size="lg">
              Start for free
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">Sign in</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-features-header">
          <h2>Everything you need to review plans</h2>
          <p>From upload to analysis — Planly handles the heavy lifting so you can focus on what matters.</p>
        </div>
        <div className="landing-features-grid">
          {features.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">
                <f.icon size={22} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-box">
          <h2>Ready to get started?</h2>
          <p>Join architects and plan reviewers who trust Planly for faster, smarter compliance.</p>
          <Link to="/register">
            <button className="landing-cta-btn">
              Create your account
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Planly. Built for architects, by engineers.</p>
      </footer>
    </div>
  )
}
