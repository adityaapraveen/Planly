import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Settings, LogOut, ChevronDown, ScanSearch } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../utils/format'
import './Navbar.css'

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <button
            className="navbar-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <Link to="/dashboard" className="navbar-brand">
            <span className="navbar-brand-mark"><ScanSearch size={17} /></span>
            <span>Planly</span>
          </Link>
          <span className="navbar-workspace-label">Review workspace</span>
        </div>

        <div className="navbar-right">
          <div className="navbar-user" ref={dropdownRef}>
            <button
              className="navbar-user-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              <div className="navbar-avatar">
                {getInitials(user?.name)}
              </div>
              <span className="navbar-user-name">{user?.name}</span>
              <ChevronDown className="navbar-user-chevron" size={14} />
            </button>

            {dropdownOpen && (
              <div className="navbar-dropdown">
                <div className="navbar-dropdown-profile">
                  <div className="navbar-dropdown-name">
                    {user?.name}
                  </div>
                  <div className="navbar-dropdown-email">
                    {user?.email}
                  </div>
                </div>
                <div className="navbar-dropdown-divider" />
                <button
                  className="navbar-dropdown-item"
                  onClick={() => { setDropdownOpen(false); navigate('/settings') }}
                >
                  <Settings size={15} />
                  Settings
                </button>
                <div className="navbar-dropdown-divider" />
                <button
                  className="navbar-dropdown-item danger"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
