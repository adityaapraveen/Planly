import { useNavigate } from 'react-router-dom'
import { FolderKanban, Pencil, Trash2, Calendar } from 'lucide-react'
import { formatRelativeTime } from '../../utils/format'
import './ProjectCard.css'

export function ProjectCard({ project, onEdit, onDelete }) {
  const navigate = useNavigate()
  const showActions = typeof onEdit === 'function' || typeof onDelete === 'function'

  const handleClick = () => {
    navigate(`/projects/${project.id}`)
  }

  return (
    <div className="project-card" onClick={handleClick}>
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
      </div>
    </div>
  )
}
