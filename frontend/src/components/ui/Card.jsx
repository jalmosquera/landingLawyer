/**
 * Card Component
 *
 * Reusable card component with header, body, and footer sections.
 * Supports dark mode styling.
 */

function Card({ children, className = '', padding = true, hover = false }) {
  const baseStyles =
    'bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700'
  const hoverStyles = hover
    ? 'transition-shadow duration-200 hover:shadow-lg'
    : ''
  const paddingStyles = padding ? 'p-6' : ''

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${paddingStyles} ${className}`}
    >
      {children}
    </div>
  )
}

function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-xl font-bold text-gray-900 dark:text-white ${className}`}>
      {children}
    </h3>
  )
}

function CardSubtitle({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 ${className}`}>
      {children}
    </p>
  )
}

function CardBody({ children, className = '' }) {
  return <div className={`${className}`}>{children}</div>
}

function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between ${className}`}
    >
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Title = CardTitle
Card.Subtitle = CardSubtitle
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
