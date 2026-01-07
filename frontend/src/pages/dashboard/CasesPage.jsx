/**
 * Cases Page
 *
 * CRUD page for managing legal cases.
 * Features: list, search, filter, create, edit, delete.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
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
import { casesAPI, clientsAPI, documentsAPI } from '../../services/api'
import useAuthStore from '../../stores/authStore'

function CasesPage() {
  const { user } = useAuthStore()
  const [cases, setCases] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState(null)

  // Documents modal state
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [selectedCaseForDocs, setSelectedCaseForDocs] = useState(null)
  const [caseDocuments, setCaseDocuments] = useState([])
  const [loadingDocuments, setLoadingDocuments] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    client: '',
    title: '',
    description: '',
    case_type: 'civil',
    status: 'open',
    priority: 'medium',
    internal_notes: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialFiles, setInitialFiles] = useState([]) // For initial case documents

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [casesRes, clientsRes] = await Promise.all([
        casesAPI.getAll().catch(() => ({ data: { results: [] } })),
        clientsAPI.getAll().catch(() => ({ data: { results: [] } })),
      ])

      setCases(casesRes.data.results || casesRes.data)
      setClients(clientsRes.data.results || clientsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      setCases([])
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const getCaseStatusColor = (status) => {
    const colors = {
      open: 'warning',
      in_progress: 'info',
      closed: 'success',
      archived: 'default',
    }
    return colors[status] || 'default'
  }

  const getCasePriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'danger',
    }
    return colors[priority] || 'default'
  }

  const getCaseTypeLabel = (type) => {
    const labels = {
      civil: 'Civil',
      penal: 'Penal',
      laboral: 'Laboral',
      familiar: 'Familiar',
      mercantil: 'Mercantil',
      administrativo: 'Administrativo',
    }
    return labels[type] || type
  }

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      closed: 'Cerrado',
      archived: 'Archivado',
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    }
    return labels[priority] || priority
  }

  const handleOpenModal = async (caseItem = null) => {
    if (caseItem) {
      setSelectedCase(caseItem)
      setFormData({
        client: caseItem.client || '',
        title: caseItem.title || '',
        description: caseItem.description || '',
        case_type: caseItem.case_type || 'civil',
        status: caseItem.status || 'open',
        priority: caseItem.priority || 'medium',
        internal_notes: caseItem.internal_notes || '',
      })

      // Load case documents for editing
      try {
        const response = await documentsAPI.getAll()
        const allDocuments = response.data.results || response.data
        const caseDocs = allDocuments.filter(doc => doc.case === caseItem.id)
        setCaseDocuments(caseDocs)
      } catch (error) {
        console.error('Error fetching case documents:', error)
        setCaseDocuments([])
      }
    } else {
      setSelectedCase(null)
      setFormData({
        client: '',
        title: '',
        description: '',
        case_type: 'civil',
        status: 'open',
        priority: 'medium',
        internal_notes: '',
      })
      setCaseDocuments([])
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCase(null)
    setFormData({
      client: '',
      title: '',
      description: '',
      case_type: 'civil',
      status: 'open',
      priority: 'medium',
      internal_notes: '',
    })
    setFormErrors({})
    setInitialFiles([])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files)
    setInitialFiles(files)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.client) {
      errors.client = 'Debe seleccionar un cliente'
    }
    if (!formData.title.trim()) {
      errors.title = 'El título es requerido'
    }
    // Validate rich text editor content (remove HTML tags for validation)
    const descriptionText = formData.description.replace(/<[^>]*>/g, '').trim()
    if (!descriptionText) {
      errors.description = 'La descripción es requerida'
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsSubmitting(true)
      if (selectedCase) {
        await casesAPI.update(selectedCase.id, formData)
      } else {
        // Create case
        const caseResponse = await casesAPI.create(formData)
        const newCase = caseResponse.data

        console.log('Case created:', newCase)
        console.log('Case ID:', newCase.id)

        // Upload initial documents if any
        if (initialFiles.length > 0) {
          const uploadPromises = initialFiles.map((file, index) => {
            const docFormData = new FormData()
            // Ensure case ID is sent as integer
            docFormData.append('case', String(newCase.id))
            const title = initialFiles.length > 1
              ? `Documento inicial ${index + 1} - ${file.name}`
              : `Documento inicial - ${file.name}`
            docFormData.append('title', title)
            docFormData.append('description', 'Documento inicial aportado al crear el caso')
            docFormData.append('document_type', 'evidence')
            docFormData.append('is_sensitive', 'false')
            docFormData.append('file', file)

            console.log('Uploading document with case ID:', newCase.id)

            return documentsAPI.create(docFormData)
          })

          await Promise.all(uploadPromises)
        }
      }
      await fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving case:', error)
      console.error('Error details:', error.response?.data)

      let errorMessage = 'Error al guardar el caso. Intenta nuevamente.'

      if (error.response?.data) {
        const errorData = error.response.data
        if (typeof errorData === 'object') {
          errorMessage = Object.entries(errorData)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`
              }
              return `${field}: ${messages}`
            })
            .join('. ')
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      }

      setFormErrors({
        general: errorMessage
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (caseItem) => {
    setCaseToDelete(caseItem)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await casesAPI.delete(caseToDelete.id)
      await fetchData()
      setIsDeleteModalOpen(false)
      setCaseToDelete(null)
    } catch (error) {
      console.error('Error deleting case:', error)
    }
  }

  const handleViewDocuments = async (caseItem) => {
    setSelectedCaseForDocs(caseItem)
    setIsDocumentsModalOpen(true)
    setLoadingDocuments(true)

    try {
      const response = await documentsAPI.getAll()
      const allDocuments = response.data.results || response.data
      // Filter documents for this specific case
      const caseDocs = allDocuments.filter(doc => doc.case === caseItem.id)
      setCaseDocuments(caseDocs)
    } catch (error) {
      console.error('Error fetching documents:', error)
      setCaseDocuments([])
    } finally {
      setLoadingDocuments(false)
    }
  }

  const handleDownloadDocument = async (doc) => {
    try {
      console.log('Document:', doc)
      console.log('File URL:', doc.file_url)

      if (!doc.file_url) {
        alert('El documento no tiene una URL de descarga disponible')
        return
      }

      // Open the file URL in a new tab
      window.open(doc.file_url, '_blank')
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Error al descargar el documento')
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return
    }

    try {
      await documentsAPI.delete(docId)
      // Refresh document list
      setCaseDocuments(prev => prev.filter(doc => doc.id !== docId))
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error al eliminar el documento')
    }
  }

  const handleDeleteAllDocuments = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar TODOS los ${caseDocuments.length} documentos de este caso?`)) {
      return
    }

    try {
      await Promise.all(caseDocuments.map(doc => documentsAPI.delete(doc.id)))
      setCaseDocuments([])
    } catch (error) {
      console.error('Error deleting documents:', error)
      alert('Error al eliminar los documentos')
    }
  }

  const handleUploadNewDocuments = async () => {
    if (initialFiles.length === 0) {
      return
    }

    try {
      const uploadPromises = initialFiles.map((file, index) => {
        const docFormData = new FormData()
        docFormData.append('case', selectedCase.id)
        const title = initialFiles.length > 1
          ? `Documento adicional ${index + 1} - ${file.name}`
          : `Documento adicional - ${file.name}`
        docFormData.append('title', title)
        docFormData.append('description', 'Documento agregado durante la edición del caso')
        docFormData.append('document_type', 'evidence')
        docFormData.append('is_sensitive', 'false')
        docFormData.append('file', file)

        return documentsAPI.create(docFormData)
      })

      const uploadedDocs = await Promise.all(uploadPromises)

      // Add new documents to the list
      const newDocs = uploadedDocs.map(response => response.data)
      setCaseDocuments(prev => [...prev, ...newDocs])
      setInitialFiles([])

      alert('Documentos subidos exitosamente')
    } catch (error) {
      console.error('Error uploading documents:', error)
      alert('Error al subir los documentos')
    }
  }

  const filteredCases = cases.filter((caseItem) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      caseItem.title?.toLowerCase().includes(search) ||
      caseItem.case_number?.toLowerCase().includes(search) ||
      caseItem.client_data?.full_name?.toLowerCase().includes(search) ||
      caseItem.description?.toLowerCase().includes(search) ||
      getCaseTypeLabel(caseItem.case_type)?.toLowerCase().includes(search) ||
      getStatusLabel(caseItem.status)?.toLowerCase().includes(search) ||
      getPriorityLabel(caseItem.priority)?.toLowerCase().includes(search)

    const matchesStatus =
      statusFilter === 'all' || caseItem.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando casos..." />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Casos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona los casos legales de tu despacho
        </p>
      </div>

      {/* Actions bar */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-80">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, caso, tipo, estado o prioridad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="closed">Cerrado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
            onClick={() => handleOpenModal()}
          >
            Nuevo Caso
          </Button>
        </div>
      </Card>

      {/* Cases table */}
      {filteredCases.length === 0 ? (
        <Card>
          <EmptyState
            title="No hay casos"
            description={
              searchTerm || statusFilter !== 'all'
                ? 'No se encontraron casos que coincidan con tu búsqueda'
                : 'Agrega tu primer caso para comenzar'
            }
            actionLabel={!searchTerm && statusFilter === 'all' ? 'Agregar Caso' : undefined}
            onAction={!searchTerm && statusFilter === 'all' ? () => handleOpenModal() : undefined}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <Table>
            <Table.Header>
              <tr>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Caso</Table.HeaderCell>
                <Table.HeaderCell>Tipo</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Prioridad</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </tr>
            </Table.Header>
            <Table.Body>
              {filteredCases.map((caseItem) => (
                <Table.Row key={caseItem.id}>
                  <Table.Cell>
                    {caseItem.client_data?.full_name ? (
                      <button
                        onClick={() => handleOpenModal(caseItem)}
                        className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-blue-400 text-left transition-colors"
                      >
                        {caseItem.client_data.full_name}
                      </button>
                    ) : (
                      '-'
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <button
                        onClick={() => handleOpenModal(caseItem)}
                        className="font-bold text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 text-left transition-colors"
                      >
                        {caseItem.title}
                      </button>
                      {caseItem.case_number && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {caseItem.case_number}
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="default" size="sm">
                      {getCaseTypeLabel(caseItem.case_type)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant={getCaseStatusColor(caseItem.status)}
                      size="sm"
                    >
                      {getStatusLabel(caseItem.status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant={getCasePriorityColor(caseItem.priority)}
                      size="sm"
                    >
                      {getPriorityLabel(caseItem.priority)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDocuments(caseItem)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded dark:text-green-400 dark:hover:bg-gray-700"
                        title="Ver Documentos"
                      >
                        <DocumentTextIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(caseItem)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(caseItem)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCase ? 'Editar Caso' : 'Nuevo Caso'}
        size="2xl"
      >
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formErrors.general}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cliente *
                </label>
                <select
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.client
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name}
                    </option>
                  ))}
                </select>
                {formErrors.client && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.client}</p>
                )}
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título del Caso *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.title
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ej: Reclamación de indemnización por accidente laboral"
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción *
                </label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(content) => {
                    setFormData((prev) => ({ ...prev, description: content }))
                    if (formErrors.description) {
                      setFormErrors((prev) => ({ ...prev, description: '' }))
                    }
                  }}
                  placeholder="Descripción detallada del caso..."
                  error={!!formErrors.description}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Case Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Caso
                </label>
                <select
                  name="case_type"
                  value={formData.case_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="civil">Civil</option>
                  <option value="penal">Penal</option>
                  <option value="laboral">Laboral</option>
                  <option value="familiar">Familiar</option>
                  <option value="mercantil">Mercantil</option>
                  <option value="administrativo">Administrativo</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="closed">Cerrado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prioridad
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Internal Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas Internas
                </label>
                <RichTextEditor
                  value={formData.internal_notes}
                  onChange={(content) => {
                    setFormData((prev) => ({ ...prev, internal_notes: content }))
                  }}
                  placeholder="Notas privadas sobre el caso..."
                />
              </div>

              {/* Documents Section */}
              <div className="md:col-span-2">
                {!selectedCase ? (
                  // Initial Documents - When creating
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Documentos Iniciales (opcional)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Sube documentos iniciales del cliente: fotos, contratos, evidencias, etc.
                    </p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFilesChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-light file:cursor-pointer"
                    />
                    {initialFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {initialFiles.length} archivo(s) seleccionado(s):
                        </p>
                        {initialFiles.map((file, index) => (
                          <p key={index} className="text-xs text-gray-500 dark:text-gray-500">
                            • {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Manage Documents - When editing
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Documentos del Caso ({caseDocuments.length})
                      </label>
                      {caseDocuments.length > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteAllDocuments}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar todos
                        </button>
                      )}
                    </div>

                    {/* Current Documents */}
                    {caseDocuments.length > 0 && (
                      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                        {caseDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {doc.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {doc.original_filename}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(doc)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-600"
                                title="Descargar"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-600"
                                title="Eliminar"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload New Documents */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Agregar Documentos
                      </label>
                      <input
                        type="file"
                        multiple
                        onChange={handleFilesChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-light file:cursor-pointer"
                      />
                      {initialFiles.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {initialFiles.length} archivo(s) seleccionado(s):
                          </p>
                          {initialFiles.map((file, index) => (
                            <p key={index} className="text-xs text-gray-500 dark:text-gray-500">
                              • {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                          ))}
                          <button
                            type="button"
                            onClick={handleUploadNewDocuments}
                            className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Subir Archivos
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={handleCloseModal} type="button">
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {selectedCase ? 'Guardar Cambios' : 'Crear Caso'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        size="md"
      >
        <Modal.Body>
          <p className="text-gray-700 dark:text-gray-300">
            ¿Estás seguro de que deseas eliminar el caso{' '}
            <span className="font-semibold">{caseToDelete?.title}</span>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Esta acción no se puede deshacer. Se eliminarán todos los datos asociados al caso.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Documents Modal */}
      <Modal
        isOpen={isDocumentsModalOpen}
        onClose={() => setIsDocumentsModalOpen(false)}
        title={`Documentos del Caso: ${selectedCaseForDocs?.title || ''}`}
        size="2xl"
      >
        <Modal.Body>
          {loadingDocuments ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" text="Cargando documentos..." />
            </div>
          ) : caseDocuments.length === 0 ? (
            <EmptyState
              title="No hay documentos"
              description="Este caso aún no tiene documentos asociados"
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {caseDocuments.length} documento(s) encontrado(s)
              </p>
              <div className="space-y-3">
                {caseDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" size="sm">
                            {doc.document_type_display}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.original_filename}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.file_size_display}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-gray-700 transition-colors ml-4"
                      title="Descargar"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            onClick={() => setIsDocumentsModalOpen(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CasesPage
