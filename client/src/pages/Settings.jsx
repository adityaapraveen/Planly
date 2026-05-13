import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { getInitials } from '../utils/format'
import './Settings.css'

export function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-card">
        <div className="settings-card-header">
          <h2>Profile</h2>
          <p>Your account information</p>
        </div>
        <div className="settings-card-body">
          <div className="settings-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="settings-field">
            <span className="settings-field-label">Full name</span>
            <span className="settings-field-value">{user?.name}</span>
          </div>
          <div className="settings-field">
            <span className="settings-field-label">Email</span>
            <span className="settings-field-value">{user?.email}</span>
          </div>
          <div className="settings-field">
            <span className="settings-field-label">User ID</span>
            <span className="settings-field-value" style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', color: 'var(--neutral-400)' }}>
              {user?.id}
            </span>
          </div>
        </div>
      </div>

      <div className="settings-danger">
        <div className="settings-card">
          <div className="settings-card-header">
            <h2>Session</h2>
            <p>Manage your current session</p>
          </div>
          <div className="settings-card-body">
            <Button variant="danger" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
