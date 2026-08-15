import { ArrowUpRight, FileText, GitCompareArrows, Trash2, UploadCloud } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatFileSize, formatRelativeTime, getStatusVariant } from '../../utils/format'
import './DrawingCard.css'

export function DrawingCard({ drawing, onClick, onDelete, onCompare, onUploadRevision }) {
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
        {drawing.revisionOf && (
          <div className="drawing-card-revision">
            <GitCompareArrows size={12} /> Revision of {drawing.revisionOf.fileName}
          </div>
        )}
      </div>
      <div className="drawing-card-right">
        <Badge variant={getStatusVariant(drawing.status)} dot>
          {drawing.status}
        </Badge>
        <div className="drawing-card-actions">
          {drawing.revisionOfId && (
            <button
              type="button"
              className="drawing-card-action compare"
              onClick={(event) => {
                event.stopPropagation()
                onCompare?.(drawing)
              }}
            >
              <GitCompareArrows size={14} /> <span>Compare</span>
            </button>
          )}
          <button
            type="button"
            className="drawing-card-action"
            title={`Upload a revision of ${drawing.fileName}`}
            onClick={(event) => {
              event.stopPropagation()
              onUploadRevision?.(drawing)
            }}
          >
            <UploadCloud size={14} /> <span>New revision</span>
          </button>
        </div>
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
