function toPercent(value, fallback = 0) {
  if (value == null || Number.isNaN(Number(value))) return fallback
  const number = Number(value)
  return number <= 1 ? number * 100 : number
}

export function ReferenceOverlay({ reference, selected, onClick }) {
  if (reference?.hasLocation === false) return null

  const location = reference.location || {}
  const top = toPercent(location.y)
  const left = toPercent(location.x)
  const width = Math.max(toPercent(location.width, 5), 2)
  const height = Math.max(toPercent(location.height, 4), 2)

  return (
    <button
      type="button"
      className={`reference-overlay ${reference.resolutionStatus.toLowerCase()} ${selected ? 'active' : ''}`}
      style={{ top: `${top}%`, left: `${left}%`, width: `${width}%`, height: `${height}%` }}
      title={`${reference.label}: ${reference.resolutionStatus.replaceAll('_', ' ').toLowerCase()}`}
      onClick={() => onClick?.(reference)}
      aria-label={`Sheet reference ${reference.label}`}
    />
  )
}
