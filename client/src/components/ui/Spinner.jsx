import './Spinner.css'

export function Spinner({ size, className = '' }) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : ''
  return <div className={`spinner ${sizeClass} ${className}`} role="status" aria-label="Loading" />
}

export function PageLoader({ text = 'Loading…' }) {
  return (
    <div className="page-loader">
      <Spinner size="lg" />
      <span className="page-loader-text">{text}</span>
    </div>
  )
}
