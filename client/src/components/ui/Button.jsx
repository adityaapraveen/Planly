import './Button.css'

export function Button({
  children,
  variant = 'primary',
  size,
  fullWidth,
  iconOnly,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size && `btn-${size}`,
    fullWidth && 'btn-full',
    iconOnly && 'btn-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
