/**
 * Table Component
 *
 * Reusable table component with support for sorting, pagination, and custom cells.
 * Responsive design with horizontal scrolling on small screens.
 */

function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
      >
        {children}
      </table>
    </div>
  )
}

function TableHeader({ children, className = '' }) {
  return (
    <thead className={`bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </thead>
  )
}

function TableHeaderCell({ children, className = '', sortable = false, onSort }) {
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
        sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''
      } ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        )}
      </div>
    </th>
  )
}

function TableBody({ children, className = '' }) {
  return (
    <tbody
      className={`bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 ${className}`}
    >
      {children}
    </tbody>
  )
}

function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

function TableCell({ children, className = '' }) {
  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 ${className}`}
    >
      {children}
    </td>
  )
}

function TableFooter({ children, className = '' }) {
  return (
    <tfoot className={`bg-gray-50 dark:bg-gray-900 ${className}`}>
      {children}
    </tfoot>
  )
}

Table.Header = TableHeader
Table.HeaderCell = TableHeaderCell
Table.Body = TableBody
Table.Row = TableRow
Table.Cell = TableCell
Table.Footer = TableFooter

export default Table
