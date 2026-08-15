import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, FileText, FolderKanban, Pencil, Trash2, Calendar } from 'lucide-react'
import { formatRelativeTime } from '../../utils/format'
import './ProjectCard.css'

export function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate()
  const showActions = typeof onEdit === 'function' || typeof onDelete === 'function'

  const handleClick = () => {
    navigate(`/projects/${project.id}`)
  }

  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <div className="project-card" onClick={handleClick} onKeyDown={handleKeyDown} role="link" tabIndex={0}>
      <div className="project-card-header">
        <div className="project-card-icon">
          <FolderKanban size={18} />
        </div>
        {showActions && (
          <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
            {typeof onEdit === 'function' && (
              <button
                type="button"
                className="project-card-action-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(project)
                }}
                aria-label="Edit project"
              >
                <Pencil size={14} />
              </button>
            )}
            {typeof onDelete === 'function' && (
              <button
                type="button"
                className="project-card-action-btn danger"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project)
                }}
                aria-label="Delete project"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      <h3 className="project-card-name">{project.name}</h3>
      {project.description && (
        <p className="project-card-desc">{project.description}</p>
      )}
      <div className="project-card-meta">
        <span className="project-card-meta-item">
          <Calendar size={12} />
          {formatRelativeTime(project.createdAt)}
        </span>
        <span className="project-card-meta-item">
          <FileText size={12} />
          {project.drawings?.length || 0} drawings
        </span>
        <ArrowUpRight className="project-card-open" size={15} aria-hidden="true" />
      </div>
    </div>
  )
}
