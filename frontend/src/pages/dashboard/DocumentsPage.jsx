/**
 * Documents Page
 *
 * Document management page with upload, notification system, and access logs.
 * Features: list, upload, notify client (email + WhatsApp), view access logs.
 */

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  DocumentArrowUpIcon,
  BellIcon,
  CheckCircleIcon,
  EyeIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import {
  Button,
  Card,
  Table,
  Modal,
  LoadingSpinner,
  EmptyState,
  Badge,
} from '../../components/ui'
import { documentsAPI, casesAPI } from '../../services/api'

function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [accessLogs, setAccessLogs] = useState([])

  // Upload form state
  const [uploadData, setUploadData] = useState({
    case: '',
    title: '',
    description: '',
    document_type: 'contract',
    is_sensitive: false,
    file: null,
  })
  const [uploadErrors, setUploadErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)

  // Notify form state
  const [notifyMessage, setNotifyMessage] = useState('')
  const [isNotifying, setIsNotifying] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [documentsRes, casesRes] = await Promise.all([
        documentsAPI.getAll().catch(() => ({ data: { results: [] } })),
        casesAPI.getAll().catch(() => ({ data: { results: [] } })),
      ])

      setDocuments(documentsRes.data.results || documentsRes.data)
      setCases(casesRes.data.results || casesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      setDocuments([])
      setCases([])
    } finally {
      setLoading(false)
    }
  }

  const getDocumentTypeLabel = (type) => {
    const labels = {
      contract: 'Contrato',
      evidence: 'Evidencia',
      resolution: 'Resolución',
      report: 'Informe',
      correspondence: 'Correspondencia',
      other: 'Otro',
    }
    return labels[type] || type
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleOpenUploadModal = () => {
    setUploadData({
      case: '',
      title: '',
      description: '',
      document_type: 'contract',
      is_sensitive: false,
      file: null,
    })
    setUploadErrors({})
    setIsUploadModalOpen(true)
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setUploadData({
      case: '',
      title: '',
      description: '',
      document_type: 'contract',
      is_sensitive: false,
      file: null,
    })
    setUploadErrors({})
  }

  const handleUploadChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      setUploadData((prev) => ({ ...prev, file: files[0] }))
    } else if (type === 'checkbox') {
      setUploadData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setUploadData((prev) => ({ ...prev, [name]: value }))
    }
    if (uploadErrors[name]) {
      setUploadErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateUpload = () => {
    const errors = {}
    if (!uploadData.case) {
      errors.case = 'Debe seleccionar un caso'
    }
    if (!uploadData.title.trim()) {
      errors.title = 'El título es requerido'
    }
    if (!uploadData.file) {
      errors.file = 'Debe seleccionar un archivo'
    }
    return errors
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    const errors = validateUpload()

    if (Object.keys(errors).length > 0) {
      setUploadErrors(errors)
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('case', uploadData.case)
      formData.append('title', uploadData.title)
      formData.append('description', uploadData.description)
      formData.append('document_type', uploadData.document_type)
      formData.append('is_sensitive', uploadData.is_sensitive)
      formData.append('file', uploadData.file)

      await documentsAPI.create(formData)
      await fetchData()
      handleCloseUploadModal()
    } catch (error) {
      console.error('Error uploading document:', error)
      setUploadErrors({
        general:
          error.response?.data?.message ||
          'Error al subir el documento. Intenta nuevamente.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleNotifyClient = (document) => {
    setSelectedDocument(document)
    setNotifyMessage('')
    setIsNotifyModalOpen(true)
  }

  const handleSendNotification = async () => {
    try {
      setIsNotifying(true)
      await documentsAPI.notifyClient(selectedDocument.id, {
        message: notifyMessage,
      })

      // Open WhatsApp in new tab
      const caseData = cases.find((c) => c.id === selectedDocument.case)
      const clientPhone = caseData?.client?.phone
      if (clientPhone) {
        const whatsappMessage = encodeURIComponent(
          `Hola ${caseData.client.full_name}, tienes un nuevo documento disponible para el caso ${caseData.case_number || caseData.title}.

📄 Documento: ${selectedDocument.title}

Código de acceso: [Se enviará por email]

Válido hasta: 24 horas

${notifyMessage ? `\nNota: ${notifyMessage}` : ''}`
        )
        window.open(
          `https://wa.me/${clientPhone}?text=${whatsappMessage}`,
          '_blank'
        )
      }

      await fetchData()
      setIsNotifyModalOpen(false)
      setSelectedDocument(null)
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Error al enviar la notificación. Intenta nuevamente.')
    } finally {
      setIsNotifying(false)
    }
  }

  const handleViewAccessLog = async (document) => {
    setSelectedDocument(document)
    try {
      const response = await documentsAPI.getAccessLog(document.id)
      setAccessLogs(response.data.results || response.data)
      setIsLogModalOpen(true)
    } catch (error) {
      console.error('Error fetching access log:', error)
      setAccessLogs([])
      setIsLogModalOpen(true)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (
      !window.confirm('¿Estás seguro de que deseas eliminar este documento?')
    ) {
      return
    }
    try {
      await documentsAPI.delete(documentId)
      await fetchData()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error al eliminar el documento.')
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    if (selectedCase === 'all') return true
    return doc.case === parseInt(selectedCase)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando documentos..." />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Documentos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona los documentos de los casos y notifica a tus clientes
        </p>
      </div>

      {/* Actions bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-80">
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los casos</option>
              {cases.map((caseItem) => (
                <option key={caseItem.id} value={caseItem.id}>
                  {caseItem.case_number || caseItem.title}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            leftIcon={<DocumentArrowUpIcon className="h-5 w-5" />}
            onClick={handleOpenUploadModal}
          >
            Subir Documento
          </Button>
        </div>
      </Card>

      {/* Documents table */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <EmptyState
            icon={DocumentTextIcon}
            title="No hay documentos"
            description={
              selectedCase !== 'all'
                ? 'No se encontraron documentos para este caso'
                : 'Sube tu primer documento para comenzar'
            }
            actionLabel={selectedCase === 'all' ? 'Subir Documento' : undefined}
            onAction={selectedCase === 'all' ? handleOpenUploadModal : undefined}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <Table>
            <Table.Header>
              <tr>
                <Table.HeaderCell>Documento</Table.HeaderCell>
                <Table.HeaderCell>Caso</Table.HeaderCell>
                <Table.HeaderCell>Tipo</Table.HeaderCell>
                <Table.HeaderCell>Tamaño</Table.HeaderCell>
                <Table.HeaderCell>Fecha</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </tr>
            </Table.Header>
            <Table.Body>
              {filteredDocuments.map((doc) => (
                <Table.Row key={doc.id}>
                  <Table.Cell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {doc.title}
                      </div>
                      {doc.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {doc.description}
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {cases.find((c) => c.id === doc.case)?.case_number ||
                      cases.find((c) => c.id === doc.case)?.title ||
                      '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="default" size="sm">
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {doc.file_size ? formatFileSize(doc.file_size) : '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-sm">{formatDate(doc.uploaded_at)}</div>
                  </Table.Cell>
                  <Table.Cell>
                    {doc.notification_sent ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="text-sm">Notificado</span>
                      </div>
                    ) : doc.is_sensitive ? (
                      <Badge variant="warning" size="sm">
                        Pendiente
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        Público
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      {!doc.notification_sent && doc.is_sensitive && (
                        <button
                          onClick={() => handleNotifyClient(doc)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                          title="Avisar al cliente"
                        >
                          <BellIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewAccessLog(doc)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded dark:text-gray-400 dark:hover:bg-gray-700"
                        title="Ver log de accesos"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-700"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        title="Subir Documento"
        size="2xl"
      >
        <form onSubmit={handleUploadSubmit}>
          <Modal.Body>
            {uploadErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {uploadErrors.general}
              </div>
            )}

            <div className="space-y-4">
              {/* Case Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caso *
                </label>
                <select
                  name="case"
                  value={uploadData.case}
                  onChange={handleUploadChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    uploadErrors.case
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Seleccionar caso</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.title}
                    </option>
                  ))}
                </select>
                {uploadErrors.case && (
                  <p className="text-red-500 text-sm mt-1">{uploadErrors.case}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título del Documento *
                </label>
                <input
                  type="text"
                  name="title"
                  value={uploadData.title}
                  onChange={handleUploadChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    uploadErrors.title
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ej: Contrato de compraventa firmado"
                />
                {uploadErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{uploadErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={uploadData.description}
                  onChange={handleUploadChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  placeholder="Descripción opcional del documento..."
                />
              </div>

              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Documento
                </label>
                <select
                  name="document_type"
                  value={uploadData.document_type}
                  onChange={handleUploadChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="contract">Contrato</option>
                  <option value="evidence">Evidencia</option>
                  <option value="resolution">Resolución</option>
                  <option value="report">Informe</option>
                  <option value="correspondence">Correspondencia</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Is Sensitive */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_sensitive"
                    checked={uploadData.is_sensitive}
                    onChange={handleUploadChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Documento sensible (requiere código para descarga)
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                  Los documentos sensibles requieren que envíes un código al cliente para que puedan descargarlo
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Archivo *
                </label>
                <input
                  type="file"
                  name="file"
                  onChange={handleUploadChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    uploadErrors.file
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {uploadErrors.file && (
                  <p className="text-red-500 text-sm mt-1">{uploadErrors.file}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tamaño máximo: 20MB
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={handleCloseUploadModal}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isUploading}
              disabled={isUploading}
              leftIcon={<DocumentArrowUpIcon className="h-5 w-5" />}
            >
              Subir Documento
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Notify Client Modal */}
      <Modal
        isOpen={isNotifyModalOpen}
        onClose={() => setIsNotifyModalOpen(false)}
        title="Avisar al Cliente"
        size="lg"
      >
        <Modal.Body>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                Sistema de Notificación de 2 Fases
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Se enviará un email con un código de 6 dígitos al cliente</li>
                <li>• Se abrirá WhatsApp con un mensaje pre-escrito</li>
                <li>• El código será válido por 24 horas</li>
                <li>• El cliente debe ingresar el código para descargar el documento</li>
              </ul>
            </div>

            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Documento:</strong> {selectedDocument?.title}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Caso:</strong>{' '}
                {cases.find((c) => c.id === selectedDocument?.case)?.title || '-'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mensaje Adicional (Opcional)
              </label>
              <textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                placeholder="Mensaje adicional para el cliente..."
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            onClick={() => setIsNotifyModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSendNotification}
            isLoading={isNotifying}
            disabled={isNotifying}
            leftIcon={<BellIcon className="h-5 w-5" />}
          >
            Enviar Notificación
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Access Log Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log de Accesos"
        size="xl"
      >
        <Modal.Body>
          <div className="mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Documento:</strong> {selectedDocument?.title}
            </p>
          </div>

          {accessLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <EyeIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay registros de acceso para este documento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Evento
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {accessLogs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {log.event_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {log.user?.name || 'Sistema'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.success ? (
                          <Badge variant="success" size="sm">
                            Exitoso
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            Fallido
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={() => setIsLogModalOpen(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default DocumentsPage
