import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { CheckCircle2, ScanSearch } from 'lucide-react'
import './Auth.css'

export function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

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
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
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
            <span className="auth-eyebrow">Architectural intelligence</span>
            <h2>Return to the evidence behind every review.</h2>
            <p>Your projects, drawing sets, cited findings, and reviewer decisions stay in one connected workspace.</p>
            <ul>
              <li><CheckCircle2 size={16} /> Project-scoped drawing evidence</li>
              <li><CheckCircle2 size={16} /> Inspectable AI-assisted findings</li>
              <li><CheckCircle2 size={16} /> Human confirmation trail</li>
            </ul>
          </div>
          <p className="auth-context-note">Built for technical review, not black-box scoring.</p>
        </aside>
        <main className="auth-container">
          <Link to="/" className="auth-brand auth-brand-mobile">
            <span className="auth-brand-mark"><ScanSearch size={18} /></span>
            Planly
          </Link>
          <div className="auth-card">
            <span className="auth-eyebrow">Workspace access</span>
          <h1>Welcome back</h1>
          <p className="auth-card-subtitle">Sign in to continue your drawing review.</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              id="login-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="login-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={8}
            />
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : 'Sign in'}
            </Button>
          </form>
          </div>
          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </main>
      </div>
    </div>
  )
}
