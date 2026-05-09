import { Link } from 'react-router-dom'
import { useState } from 'react'
import { FolderKanban, FileText, Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { updateProject, deleteProject } from '../services/project.service'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { ProjectCard } from '../components/features/ProjectCard'
import './Dashboard.css'

export function Dashboard() {
  const { user } = useAuth()
  const { projects, loading, error, refetch } = useProjects()
  const [editProject, setEditProject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const totalDrawings = projects.reduce((sum, project) => sum + (project.drawings?.length || 0), 0)
  const totalAnalyses = projects.reduce(
    (sum, project) => sum + (project.drawings?.filter((drawing) => !!drawing.analysis).length || 0),
    0
  )

  const openEdit = (project) => {
    setFormName(project.name)
    setFormDesc(project.description || '')
    setFormError('')
    setEditProject(project)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editProject) return
    setSubmitting(true)
    setFormError('')
    try {
      await updateProject(editProject.id, { name: formName, description: formDesc || undefined })
      setEditProject(null)
      await refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    setFormError('')
    try {
      await deleteProject(deleteTarget.id)
      setDeleteTarget(null)
      await refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

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
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!editProject}
        onClose={() => setEditProject(null)}
        title="Edit project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditProject(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting || !formName.trim()}>
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <form className="project-form" onSubmit={handleEditSubmit}>
          {formError && <div className="auth-error">{formError}</div>}
          <Input id="dashboard-edit-name" label="Project name" value={formName} onChange={(e) => setFormName(e.target.value)} required minLength={2} />
          <Textarea id="dashboard-edit-desc" label="Description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        {formError && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{formError}</div>}
        <p className="confirm-text">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will permanently remove all drawings and analyses. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
