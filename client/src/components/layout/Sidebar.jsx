import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Settings, Sparkles } from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Workspace</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-intelligence-note">
          <div className="sidebar-intelligence-icon"><Sparkles size={15} /></div>
          <div>
            <strong>Evidence-led AI</strong>
            <p>Answers stay linked to your drawing set.</p>
          </div>
        </div>
      </aside>
    </>
  )
}
