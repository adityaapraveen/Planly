import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { CheckCircle2, ScanSearch } from 'lucide-react'
import './Auth.css'

export function Register() {
  const { register, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({ name, email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-context">
          <Link to="/" className="auth-brand auth-brand-light">
            <span className="auth-brand-mark"><ScanSearch size={18} /></span>
            Planly
          </Link>
          <div className="auth-context-copy">
            <span className="auth-eyebrow">Start with one drawing set</span>
            <h2>Build a review record your team can inspect.</h2>
            <p>Bring source drawings, AI assistance, and reviewer judgment together without losing the evidence chain.</p>
            <ul>
              <li><CheckCircle2 size={16} /> Organize drawings by project</li>
              <li><CheckCircle2 size={16} /> Review multiple technical modes</li>
              <li><CheckCircle2 size={16} /> Preserve human corrections</li>
            </ul>
          </div>
          <p className="auth-context-note">AI assists the review. Your team owns the decision.</p>
        </aside>
        <main className="auth-container">
          <Link to="/" className="auth-brand auth-brand-mobile">
            <span className="auth-brand-mark"><ScanSearch size={18} /></span>
            Planly
          </Link>
          <div className="auth-card">
            <span className="auth-eyebrow">Create workspace</span>
          <h1>Create your account</h1>
          <p className="auth-card-subtitle">Set up your account and start a project workspace.</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              id="register-name"
              label="Full name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
            />
            <Input
              id="register-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="register-password"
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : 'Create account'}
            </Button>
          </form>
          </div>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </main>
      </div>
    </div>
  )
}
