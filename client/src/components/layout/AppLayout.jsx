import { useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { PageLoader } from '../ui/Spinner'
import './AppLayout.css'

export function AppLayout() {
  const { isAuthenticated, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) return <PageLoader text="Loading your workspace…" />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="app-layout">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="app-layout-body">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="app-layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
