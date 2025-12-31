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
  RichTextEditor,
} from '../../components/ui'
import { documentsAPI, casesAPI, clientsAPI } from '../../services/api'

function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [cases, setCases] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [accessLogs, setAccessLogs] = useState([])

  // Client search state
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  // Upload form state
  const [uploadData, setUploadData] = useState({
    client: '',
    case: '',
    title: '',
    description: '',
    document_type: 'contract',
    is_sensitive: false,
    files: [],
  })
  const [uploadErrors, setUploadErrors] = useState({})
  const [isUploading, setIsUploading] = useState(false)

  // Notify form state
  const [notifyMessage, setNotifyMessage] = useState('')
  const [isNotifying, setIsNotifying] = useState(false)
  const [notificationResult, setNotificationResult] = useState(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [documentsRes, casesRes, clientsRes] = await Promise.all([
        documentsAPI.getAll().catch(() => ({ data: { results: [] } })),
        casesAPI.getAll().catch(() => ({ data: { results: [] } })),
        clientsAPI.getAll().catch(() => ({ data: { results: [] } })),
      ])

      setDocuments(documentsRes.data.results || documentsRes.data)
      setCases(casesRes.data.results || casesRes.data)
      setClients(clientsRes.data.results || clientsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      setDocuments([])
      setCases([])
      setClients([])
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

  const getEventTypeLabel = (eventType) => {
    const labels = {
      upload: 'Subida',
      download: 'Descarga',
      code_validated: 'Código Validado',
      notification_sent: 'Notificación Enviada',
      access_denied: 'Acceso Denegado',
      token_expired: 'Token Expirado',
      access: 'Acceso',
      view: 'Visualización',
    }
    return labels[eventType] || eventType
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
      client: '',
      case: '',
      title: '',
      description: '',
      document_type: 'contract',
      is_sensitive: false,
      files: [],
    })
    setUploadErrors({})
    setClientSearchTerm('')
    setShowClientDropdown(false)
    setIsUploadModalOpen(true)
  }

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false)
    setUploadData({
      client: '',
      case: '',
      title: '',
      description: '',
      document_type: 'contract',
      is_sensitive: false,
      files: [],
    })
    setUploadErrors({})
    setClientSearchTerm('')
    setShowClientDropdown(false)
  }

  const handleUploadChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      setUploadData((prev) => ({ ...prev, files: Array.from(files) }))
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
    if (!uploadData.client) {
      errors.client = 'Debe seleccionar un cliente'
    }
    if (!uploadData.case) {
      errors.case = 'Debe seleccionar un caso'
    }
    if (!uploadData.title.trim()) {
      errors.title = 'El título es requerido'
    }
    if (!uploadData.files || uploadData.files.length === 0) {
      errors.file = 'Debe seleccionar al menos un archivo'
    }
    return errors
  }

  // Filter clients based on search term
  const filteredClients = clients.filter((client) => {
    if (!clientSearchTerm.trim()) return true
    const searchLower = clientSearchTerm.toLowerCase()
    return (
      client.full_name?.toLowerCase().includes(searchLower) ||
      client.identification_number?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower)
    )
  })

  // Get cases for selected client
  const clientCases = uploadData.client
    ? cases.filter((c) => c.client === parseInt(uploadData.client))
    : []

  // Handle client selection
  const handleClientSelect = (clientId) => {
    setUploadData((prev) => ({ ...prev, client: clientId, case: '' }))
    const selectedClient = clients.find((c) => c.id === clientId)
    setClientSearchTerm(selectedClient?.full_name || '')
    setShowClientDropdown(false)
    if (uploadErrors.client) {
      setUploadErrors((prev) => ({ ...prev, client: '' }))
    }
  }

  // Handle client search input
  const handleClientSearchChange = (e) => {
    setClientSearchTerm(e.target.value)
    setShowClientDropdown(true)
    if (!e.target.value.trim()) {
      setUploadData((prev) => ({ ...prev, client: '', case: '' }))
    }
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

      // Upload each file separately
      const uploadPromises = uploadData.files.map((file, index) => {
        const formData = new FormData()
        formData.append('case', uploadData.case)
        // If multiple files, append index to title
        const title = uploadData.files.length > 1
          ? `${uploadData.title} (${index + 1}/${uploadData.files.length})`
          : uploadData.title
        formData.append('title', title)
        formData.append('description', uploadData.description)
        formData.append('document_type', uploadData.document_type)
        formData.append('is_sensitive', uploadData.is_sensitive)
        formData.append('file', file)

        return documentsAPI.create(formData)
      })

      await Promise.all(uploadPromises)
      await fetchData()
      handleCloseUploadModal()
    } catch (error) {
      console.error('Error uploading documents:', error)
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
      const response = await documentsAPI.notifyClient(selectedDocument.id, {
        message: notifyMessage,
      })

      // Store notification result
      const result = response.data
      setNotificationResult(result)

      // Open WhatsApp in new tab with actual code
      const caseData = cases.find((c) => c.id === selectedDocument.case)
      const clientData = caseData?.client_data
      const clientPhone = clientData?.phone

      if (clientPhone && result.access_code) {
        const expiresDate = new Date(result.expires_at)
        const whatsappMessage = encodeURIComponent(
          `Hola ${clientData.full_name}, tienes un nuevo documento disponible para el caso ${caseData.case_number || caseData.title}.

📄 Documento: ${selectedDocument.title}

🔑 Código de acceso: ${result.access_code}

🔗 Ingresa en: ${window.location.origin}/documents/verify

⏰ Válido hasta: ${expiresDate.toLocaleString('es-ES')}

${notifyMessage ? `\nNota: ${notifyMessage}` : ''}`
        )
        window.open(
          `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${whatsappMessage}`,
          '_blank'
        )
      }

      await fetchData()
      setIsNotifyModalOpen(false)
      setIsSuccessModalOpen(true)
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
      // Backend returns {document: {...}, logs: [...], total_logs: N}
      setAccessLogs(response.data.logs || [])
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
    if (selectedClient === 'all') return true
    return doc.case_data?.client === parseInt(selectedClient)
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
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name}
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
              selectedClient !== 'all'
                ? 'No se encontraron documentos para este cliente'
                : 'Sube tu primer documento para comenzar'
            }
            actionLabel={selectedClient === 'all' ? 'Subir Documento' : undefined}
            onAction={selectedClient === 'all' ? handleOpenUploadModal : undefined}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <tr>
                  <Table.HeaderCell className="w-[25%]">Documento</Table.HeaderCell>
                  <Table.HeaderCell className="w-[20%]">Caso</Table.HeaderCell>
                  <Table.HeaderCell className="w-[10%]">Tipo</Table.HeaderCell>
                  <Table.HeaderCell className="w-[8%]">Tamaño</Table.HeaderCell>
                  <Table.HeaderCell className="w-[12%]">Fecha</Table.HeaderCell>
                  <Table.HeaderCell className="w-[12%]">Estado</Table.HeaderCell>
                  <Table.HeaderCell className="w-[13%]">Acciones</Table.HeaderCell>
                </tr>
              </Table.Header>
              <Table.Body>
                {filteredDocuments.map((doc) => (
                  <Table.Row key={doc.id}>
                    <Table.Cell className="w-[25%]">
                      <div className="max-w-[300px]">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {doc.case_data?.client_data?.full_name || '-'}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="w-[20%]">
                      {doc.case_data ? (
                        <div className="max-w-[200px]">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                            {doc.case_data.case_number}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {doc.case_data.title}
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </Table.Cell>
                    <Table.Cell className="w-[10%]">
                      <Badge variant="default" size="sm">
                        {getDocumentTypeLabel(doc.document_type)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="w-[8%]">
                      <span className="text-sm whitespace-nowrap">
                        {doc.file_size ? formatFileSize(doc.file_size) : '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="w-[12%]">
                      <div className="text-xs whitespace-nowrap">{formatDate(doc.uploaded_at)}</div>
                    </Table.Cell>
                    <Table.Cell className="w-[12%]">
                      {doc.notification_sent ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-xs whitespace-nowrap">Notificado</span>
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
                    <Table.Cell className="w-[13%]">
                      <div className="flex items-center gap-1">
                        {!doc.notification_sent && doc.is_sensitive && (
                          <button
                            onClick={() => handleNotifyClient(doc)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                            title="Avisar al cliente"
                          >
                            <BellIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewAccessLog(doc)}
                          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded dark:text-gray-400 dark:hover:bg-gray-700"
                          title="Ver log de accesos"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-700"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
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
              {/* Client Selection with Search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cliente *
                  </label>
                  <button
                    type="button"
                    onClick={() => window.open('/dashboard/clients', '_blank')}
                    className="text-xs text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Crear Cliente
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={clientSearchTerm}
                    onChange={handleClientSearchChange}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Buscar por nombre, cédula o email..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                      uploadErrors.client
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client.id)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {client.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.identification_number && (
                              <span className="mr-3">
                                {client.identification_type}: {client.identification_number}
                              </span>
                            )}
                            {client.email}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {uploadErrors.client && (
                  <p className="text-red-500 text-sm mt-1">{uploadErrors.client}</p>
                )}
                {uploadData.client && !showClientDropdown && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ Cliente seleccionado: {clients.find(c => c.id === parseInt(uploadData.client))?.full_name}
                  </p>
                )}
              </div>

              {/* Case Selection - Only shown when client is selected */}
              {uploadData.client && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Caso *
                  </label>
                  {clientCases.length === 0 ? (
                    <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                      Este cliente no tiene casos asignados. Por favor, crea un caso primero.
                    </div>
                  ) : (
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
                      {clientCases.map((caseItem) => (
                        <option key={caseItem.id} value={caseItem.id}>
                          {caseItem.case_number || caseItem.title}
                        </option>
                      ))}
                    </select>
                  )}
                  {uploadErrors.case && (
                    <p className="text-red-500 text-sm mt-1">{uploadErrors.case}</p>
                  )}
                </div>
              )}

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
                <RichTextEditor
                  value={uploadData.description}
                  onChange={(content) => {
                    setUploadData((prev) => ({ ...prev, description: content }))
                  }}
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
                  Archivos *
                </label>
                <input
                  type="file"
                  name="file"
                  multiple
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
                {uploadData.files.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ {uploadData.files.length} archivo(s) seleccionado(s)
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tamaño máximo por archivo: 20MB. Puedes seleccionar múltiples archivos.
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
              {isUploading ? 'Subiendo...' : uploadData.files.length > 1 ? `Subir ${uploadData.files.length} Documentos` : 'Subir Documento'}
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
                {(() => {
                  const caseData = selectedDocument?.case_data || cases.find((c) => c.id === selectedDocument?.case)
                  return caseData ? `${caseData.case_number} - ${caseData.title}` : '-'
                })()}
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
          <div className="mb-4 space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Documento:</strong> {selectedDocument?.title}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Caso:</strong>{' '}
              {(() => {
                const caseData = selectedDocument?.case_data || cases.find((c) => c.id === selectedDocument?.case)
                return caseData ? `${caseData.case_number} - ${caseData.title}` : '-'
              })()}
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
                        {getEventTypeLabel(log.event_type)}
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

      {/* Success Modal - Show access code */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false)
          setNotificationResult(null)
          setSelectedDocument(null)
        }}
        title="✅ Notificación Enviada"
        size="lg"
      >
        <Modal.Body>
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                Notificación enviada exitosamente
              </h4>
              <p className="text-sm text-green-800 dark:text-green-300 mb-1">
                {notificationResult?.email_sent
                  ? '✓ Email enviado al cliente'
                  : '⚠ Email no pudo enviarse (revisa configuración SMTP)'}
              </p>
              {notificationResult?.documents_count > 0 && (
                <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                  📄 Se notificaron {notificationResult.documents_count} documento{notificationResult.documents_count > 1 ? 's' : ''} del mismo caso con este código
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-6 text-center">
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                Código de Acceso
              </p>
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="text-4xl font-bold text-blue-900 dark:text-blue-100 font-mono tracking-widest">
                  {notificationResult?.access_code || '------'}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(notificationResult?.access_code || '')
                    alert('Código copiado al portapapeles')
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded"
                  title="Copiar código"
                >
                  📋
                </button>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Válido hasta:{' '}
                {notificationResult?.expires_at
                  ? new Date(notificationResult.expires_at).toLocaleString('es-ES')
                  : '-'}
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2 text-sm">
                📝 Para Testing / Desarrollo
              </h4>
              <p className="text-xs text-yellow-800 dark:text-yellow-300 mb-2">
                Puedes usar este código para probar el flujo de verificación:
              </p>
              <ol className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1 ml-4">
                <li>1. Copia el código de arriba (📋)</li>
                <li>2. Abre ventana de incógnito o cierra sesión</li>
                <li>
                  3. ⚠️ <strong>IMPORTANTE:</strong> Ve a{' '}
                  <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded font-bold">
                    /documents/verify
                  </code>{' '}
                  (ruta PÚBLICA, NO /portal/documents/verify)
                </li>
                <li>4. Ingresa el código + email del cliente</li>
                <li>5. Verás {notificationResult?.documents_count || 1} documento{(notificationResult?.documents_count || 1) > 1 ? 's' : ''} - descarga los que necesites ✅</li>
              </ol>
              <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/documents/verify`
                    navigator.clipboard.writeText(url)
                    alert('URL copiada: ' + url)
                  }}
                  className="text-xs text-yellow-900 dark:text-yellow-100 underline hover:no-underline"
                >
                  📋 Copiar URL de verificación pública
                </button>
              </div>
            </div>

            {notificationResult?.whatsapp_link && (
              <div>
                <Button
                  variant="primary"
                  onClick={() => window.open(notificationResult.whatsapp_link, '_blank')}
                  className="w-full"
                >
                  Abrir WhatsApp con mensaje
                </Button>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            onClick={() => {
              setIsSuccessModalOpen(false)
              setNotificationResult(null)
              setSelectedDocument(null)
            }}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default DocumentsPage
