import { Link } from 'react-router-dom'
import { FolderKanban, FileText, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { ProjectCard } from '../components/features/ProjectCard'
import './Dashboard.css'

export function Dashboard() {
  const { user } = useAuth()
  const { projects, loading, error, refetch } = useProjects()
  const totalDrawings = projects.reduce((sum, project) => sum + (project.drawings?.length || 0), 0)
  const totalAnalyses = projects.reduce(
    (sum, project) => sum + (project.drawings?.filter((drawing) => !!drawing.analysis).length || 0),
    0
  )

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p>Here's an overview of your workspace</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon neutral"><FolderKanban size={20} /></div>
          <div>
            <div className="stat-card-value">{projects.length}</div>
            <div className="stat-card-label">Projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon primary"><FileText size={20} /></div>
          <div>
            <div className="stat-card-value">{totalDrawings}</div>
            <div className="stat-card-label">Drawings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon success"><Sparkles size={20} /></div>
          <div>
            <div className="stat-card-value">{totalAnalyses}</div>
            <div className="stat-card-label">Analyses</div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent Projects</h2>
          <Link to="/projects">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start uploading and analyzing drawings."
            action={<Link to="/projects"><Button>Create project</Button></Link>}
          />
        ) : (
          <div className="dashboard-projects-grid">
            {projects.slice(0, 4).map((p) => (
              <ProjectCard key={p.id} project={p} onEdit={() => {}} onDelete={() => {}} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
