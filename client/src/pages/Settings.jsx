import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { getInitials } from '../utils/format'
import { LogOut, ShieldCheck, UserRound } from 'lucide-react'
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
      <header className="settings-heading">
        <span className="page-eyebrow">Account</span>
        <h1>Settings</h1>
        <p>Review your profile and manage this browser session.</p>
      </header>

      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-section-icon"><UserRound size={17} /></div>
          <div><h2>Profile</h2>
          <p>Your account information</p>
          </div>
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
            <span className="settings-field-value settings-user-id">
              {user?.id}
            </span>
          </div>
        </div>
      </div>

      <div className="settings-danger">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-icon neutral"><ShieldCheck size={17} /></div>
            <div><h2>Session</h2>
            <p>Manage your current session</p>
            </div>
          </div>
          <div className="settings-card-body">
            <Button variant="danger" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
