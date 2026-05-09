import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, FileText, Upload } from 'lucide-react'
import { useProject } from '../hooks/useProject'
import { useDrawings } from '../hooks/useDrawings'
import { useAnalysis } from '../hooks/useAnalysis'
import { deleteDrawing, uploadDrawing } from '../services/drawing.service'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { DrawingCard } from '../components/features/DrawingCard'
import { AnalysisPanel } from '../components/features/AnalysisPanel'
import { FileUpload } from '../components/features/FileUpload'
import './ProjectDetail.css'

function DrawingAnalysisView({ drawing, onAnalysisDone }) {
  const { analysis, loading, error, triggerAnalysis, fetchAnalysis } = useAnalysis(drawing?.id)

  // Auto-fetch only when analysis is expected to exist
  useEffect(() => {
    if (drawing?.id && drawing?.status === 'COMPLETED') {
      fetchAnalysis()
    }
  }, [drawing?.id, drawing?.status, fetchAnalysis])

  const handleAnalyze = async () => {
    const result = await triggerAnalysis()
    await onAnalysisDone?.()
    return result
  }

  return (
    <div className="drawing-detail-panel">
      <AnalysisPanel analysis={analysis} loading={loading} error={error} onAnalyze={handleAnalyze} />
    </div>
  )
}

export function ProjectDetail() {
  const { projectId } = useParams()
  const { project, loading: projectLoading, error: projectError } = useProject(projectId)
  const { drawings, loading: drawingsLoading, error: drawingsError, refetch: refetchDrawings } = useDrawings(projectId)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedDrawing, setSelectedDrawing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!selectedDrawing) return
    const nextSelected = drawings.find((drawing) => drawing.id === selectedDrawing.id)
    if (nextSelected) {
      setSelectedDrawing(nextSelected)
    } else {
      setSelectedDrawing(null)
    }
  }, [drawings, selectedDrawing])

  const handleFileSelect = async (file) => {
    setUploading(true)
    setUploadError('')
    try {
      await uploadDrawing(projectId, file)
      setShowUpload(false)
      refetchDrawings()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
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
          <div>
            <h1>{project?.name}</h1>
            {project?.description && <p className="project-detail-desc">{project.description}</p>}
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Upload size={16} /> Upload drawing
          </Button>
        </div>
      </div>

      <div className="project-detail-section">
        <div className="project-detail-section-header">
          <h2>Drawings</h2>
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
            action={<Button onClick={() => setShowUpload(true)}><Upload size={16} /> Upload drawing</Button>}
          />
        ) : (
          <div className="drawings-list">
            {drawings.map((d) => (
              <DrawingCard
                key={d.id}
                drawing={d}
                onClick={() => setSelectedDrawing(selectedDrawing?.id === d.id ? null : d)}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {selectedDrawing && <DrawingAnalysisView drawing={selectedDrawing} onAnalysisDone={refetchDrawings} />}

      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload drawing" footer={
        uploading ? <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--neutral-400)' }}>Uploading…</span> : null
      }>
        {uploadError && <div className="auth-error" style={{ marginBottom: 'var(--space-4)' }}>{uploadError}</div>}
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
