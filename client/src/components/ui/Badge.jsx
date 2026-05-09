import './Badge.css'

export function Badge({ children, variant = 'neutral', dot = false }) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  )
}
