import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight, FolderKanban, FileText, Sparkles, ShieldCheck } from 'lucide-react'
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
  const reviewCoverage = totalDrawings > 0 ? Math.round((totalAnalyses / totalDrawings) * 100) : 0

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
        <div>
          <span className="page-eyebrow">Workspace overview</span>
          <h1>Good to see you, {user?.name?.split(' ')[0]}</h1>
          <p>Track drawing coverage and return to the project that needs attention.</p>
        </div>
        <Link to="/projects">
          <Button>Open projects <ArrowRight size={16} /></Button>
        </Link>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon neutral"><FolderKanban size={20} /></div>
          <div>
            <div className="stat-card-kicker">Portfolio</div>
            <div className="stat-card-value">{projects.length}</div>
            <div className="stat-card-label">Active projects</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon primary"><FileText size={20} /></div>
          <div>
            <div className="stat-card-kicker">Documents</div>
            <div className="stat-card-value">{totalDrawings}</div>
            <div className="stat-card-label">Drawing files</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon success"><Sparkles size={20} /></div>
          <div>
            <div className="stat-card-kicker">Reviewed</div>
            <div className="stat-card-value">{totalAnalyses}</div>
            <div className="stat-card-label">AI-assisted analyses</div>
          </div>
        </div>
        <div className="stat-card coverage">
          <div className="stat-card-icon coverage"><ShieldCheck size={20} /></div>
          <div className="stat-card-coverage-copy">
            <div className="stat-card-kicker">Coverage</div>
            <div className="stat-card-value">{reviewCoverage}%</div>
            <div className="stat-progress" aria-label={`${reviewCoverage}% of drawings analyzed`}>
              <span style={{ width: `${reviewCoverage}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <span className="section-eyebrow">Continue reviewing</span>
            <h2>Recent projects</h2>
          </div>
          <Link to="/projects">
            <Button variant="ghost" size="sm">View all <ArrowRight size={14} /></Button>
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
