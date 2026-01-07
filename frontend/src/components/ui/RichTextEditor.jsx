/**
 * Rich Text Editor Component
 *
 * Wrapper around ReactQuill with custom styling and configuration.
 * Supports bold, italic, underline, lists, and links.
 */

import { useMemo } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  error = false,
  className = ''
}) {
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  }), [])

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ]

  return (
    <div className={`rich-text-editor ${error ? 'error' : ''} ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  )
}

export default RichTextEditor
