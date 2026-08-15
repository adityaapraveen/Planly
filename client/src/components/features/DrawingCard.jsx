import { ArrowUpRight, FileText, Trash2 } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatFileSize, formatRelativeTime, getStatusVariant } from '../../utils/format'
import './DrawingCard.css'

export function DrawingCard({ drawing, onClick, onDelete }) {
  const openDrawing = () => onClick?.(drawing)

  return (
    <div
      className="drawing-card"
      onClick={openDrawing}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openDrawing()
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="drawing-card-icon">
        <FileText size={20} />
      </div>
      <div className="drawing-card-info">
        <div className="drawing-card-name">{drawing.fileName}</div>
        <div className="drawing-card-meta">
          <span>{formatFileSize(drawing.size)}</span>
          <span>·</span>
          <span>{formatRelativeTime(drawing.createdAt)}</span>
        </div>
      </div>
      <div className="drawing-card-right">
        <Badge variant={getStatusVariant(drawing.status)} dot>
          {drawing.status}
        </Badge>
        <ArrowUpRight className="drawing-card-open" size={16} aria-hidden="true" />
        <button
          type="button"
          className="drawing-card-delete"
          aria-label={`Delete ${drawing.fileName}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(drawing)
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
