/**
 * Badge Component
 *
 * Reusable badge component for status indicators and labels.
 * Supports multiple variants and sizes.
 */

function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full'

  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary/10 text-primary dark:bg-primary/20',
    accent: 'bg-accent/10 text-accent dark:bg-accent/20',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  }

  const variantClass = variants[variant] || variants.default
  const sizeClass = sizes[size] || sizes.md

  return (
    <span className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
