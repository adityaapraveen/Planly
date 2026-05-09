import { FileText } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { formatFileSize, formatRelativeTime, getStatusVariant } from '../../utils/format'
import './DrawingCard.css'

export function DrawingCard({ drawing, onClick }) {
  return (
    <div className="drawing-card" onClick={() => onClick?.(drawing)}>
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
      </div>
    </div>
  )
}
