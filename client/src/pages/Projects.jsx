import { useState } from 'react'
import { Plus, FolderKanban } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { createProject, updateProject, deleteProject } from '../services/project.service'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { ProjectCard } from '../components/features/ProjectCard'
import './Projects.css'

export function Projects() {
  const { projects, loading, error, refetch } = useProjects()
  const [showCreate, setShowCreate] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const openCreate = () => {
    setFormName('')
    setFormDesc('')
    setFormError('')
    setShowCreate(true)
  }

  const openEdit = (p) => {
    setFormName(p.name)
    setFormDesc(p.description || '')
    setFormError('')
    setEditProject(p)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      await createProject({ name: formName, description: formDesc || undefined })
      setShowCreate(false)
      refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      await updateProject(editProject.id, { name: formName, description: formDesc || undefined })
      setEditProject(null)
      refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await deleteProject(deleteTarget.id)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <PageLoader />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <span className="page-eyebrow">Drawing-set portfolio</span>
          <h1>Projects</h1>
          <p>Organize issued sets, inspect evidence, and keep review decisions together.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> New project</Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start organizing and analyzing architectural drawings."
          action={<Button onClick={openCreate}><Plus size={16} /> New project</Button>}
        />
      ) : (
        <div className="projects-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New project" footer={
        <>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateSubmit} disabled={submitting || !formName.trim()}>
            {submitting ? 'Creating…' : 'Create'}
          </Button>
        </>
      }>
        <form className="project-form" onSubmit={handleCreateSubmit}>
          {formError && <div className="auth-error">{formError}</div>}
          <Input id="create-name" label="Project name" placeholder="e.g. Riverside Complex" value={formName} onChange={(e) => setFormName(e.target.value)} required minLength={2} autoFocus />
          <Textarea id="create-desc" label="Description (optional)" placeholder="Brief description of the project…" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit project" footer={
        <>
          <Button variant="secondary" onClick={() => setEditProject(null)}>Cancel</Button>
          <Button onClick={handleEditSubmit} disabled={submitting || !formName.trim()}>
            {submitting ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }>
        <form className="project-form" onSubmit={handleEditSubmit}>
          {formError && <div className="auth-error">{formError}</div>}
          <Input id="edit-name" label="Project name" value={formName} onChange={(e) => setFormName(e.target.value)} required minLength={2} />
          <Textarea id="edit-desc" label="Description" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete project" footer={
        <>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }>
        <p className="confirm-text">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will permanently remove all drawings and analyses. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
