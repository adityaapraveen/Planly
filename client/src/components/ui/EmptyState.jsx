import './EmptyState.css'

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={24} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
