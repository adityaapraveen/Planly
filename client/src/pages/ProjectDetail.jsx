import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, GitCompareArrows, Layers3, Upload } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { useDrawings } from '../hooks/useDrawings'
import { deleteDrawing, uploadDrawing } from '../services/drawing.service'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { DrawingCard } from '../components/features/DrawingCard'
import { FileUpload } from '../components/features/FileUpload'
import { ProjectIntelligence } from '../components/features/ProjectIntelligence'
import './ProjectDetail.css'

export function ProjectDetail() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { project, loading: projectLoading, error: projectError } = useProject(projectId)
  const { drawings, loading: drawingsLoading, error: drawingsError, refetch: refetchDrawings } = useDrawings(projectId)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [revisionOfId, setRevisionOfId] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleFileSelect = async (file) => {
    setUploading(true)
    setUploadError('')
    try {
      await uploadDrawing(projectId, file, { revisionOfId: revisionOfId || null })
      setShowUpload(false)
      setRevisionOfId('')
      refetchDrawings()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const openUpload = (previousDrawing = null) => {
    setUploadError('')
    setRevisionOfId(previousDrawing?.id || '')
    setShowUpload(true)
  }

  const handleDeleteDrawing = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteDrawing(projectId, deleteTarget.id)
      setDeleteTarget(null)
      await refetchDrawings()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (projectLoading) return <PageLoader />
  if (projectError) return <ErrorState message={projectError} />

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <div className="project-detail-breadcrumb">
          <Link to="/projects">Projects</Link>
          <ChevronRight size={14} />
          <span>{project?.name}</span>
        </div>
        <div className="project-detail-title">
          <div className="project-detail-heading-copy">
            <span className="page-eyebrow">Project workspace</span>
            <h1>{project?.name}</h1>
            {project?.description && <p className="project-detail-desc">{project.description}</p>}
            <div className="project-detail-meta">
              <span><Layers3 size={14} /> {drawings.length} drawing {drawings.length === 1 ? 'file' : 'files'}</span>
              <span className={`project-detail-live ${drawings.length === 0 ? 'waiting' : ''}`}><i /> {drawings.length > 0 ? 'Evidence-ready workspace' : 'Awaiting first drawing'}</span>
            </div>
          </div>
          <Button onClick={() => openUpload()}>
            <Upload size={16} /> Upload drawing
          </Button>
        </div>
      </div>

      <ProjectIntelligence projectId={projectId} />

      <div className="project-detail-section">
        <div className="project-detail-section-header">
          <div>
            <span className="section-eyebrow">Source documents</span>
            <h2>Drawings</h2>
          </div>
        </div>

        {drawingsLoading ? (
          <PageLoader text="Loading drawings…" />
        ) : drawingsError ? (
          <ErrorState message={drawingsError} onRetry={refetchDrawings} />
        ) : drawings.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No drawings uploaded"
            description="Upload a PDF drawing to get started with AI-powered compliance analysis."
            action={<Button onClick={() => openUpload()}><Upload size={16} /> Upload drawing</Button>}
          />
        ) : (
          <div className="drawings-list">
            {drawings.map((d) => (
              <DrawingCard
                key={d.id}
                drawing={d}
                onClick={() => navigate(`/drawings/${d.id}/report`)}
                onDelete={setDeleteTarget}
                onCompare={() => navigate(`/drawings/${d.id}/compare`)}
                onUploadRevision={openUpload}
              />
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setRevisionOfId('') }} title={revisionOfId ? 'Upload drawing revision' : 'Upload drawing'} footer={
        uploading ? <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-400)' }}>Uploading…</span> : null
      }>
        {uploadError && <div className="auth-error project-upload-error">{uploadError}</div>}
        {drawings.length > 0 && (
          <div className="revision-upload-field">
            <label htmlFor="revision-of">Revision relationship</label>
            <div className="revision-upload-select-wrap">
              <GitCompareArrows size={16} />
              <select
                id="revision-of"
                value={revisionOfId}
                onChange={(event) => setRevisionOfId(event.target.value)}
                disabled={uploading}
              >
                <option value="">Standalone drawing—not a revision</option>
                {drawings.map((drawing) => (
                  <option value={drawing.id} key={drawing.id}>Revision of {drawing.fileName}</option>
                ))}
              </select>
            </div>
            <p>{revisionOfId ? 'Planly will compare sheet metadata and findings after analysis completes.' : 'Choose an earlier drawing to enable revision comparison.'}</p>
          </div>
        )}
        <FileUpload onFileSelect={handleFileSelect} uploading={uploading} />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null)
            setDeleteError('')
          }
        }}
        title="Delete drawing"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteTarget(null)
                setDeleteError('')
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteDrawing} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        {deleteError && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{deleteError}</div>}
        <p className="confirm-text">
          Are you sure you want to delete <strong>{deleteTarget?.fileName}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
