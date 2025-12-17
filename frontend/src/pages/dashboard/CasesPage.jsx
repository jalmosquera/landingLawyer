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
import { casesAPI, clientsAPI, usersAPI } from '../../services/api'
import useAuthStore from '../../stores/authStore'

function CasesPage() {
  const { user } = useAuthStore()
  const [cases, setCases] = useState([])
  const [clients, setClients] = useState([])
  const [staffUsers, setStaffUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    client: '',
    assigned_to: '',
    title: '',
    description: '',
    case_type: 'civil',
    status: 'open',
    priority: 'medium',
    internal_notes: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [casesRes, clientsRes, usersRes] = await Promise.all([
        casesAPI.getAll().catch(() => ({ data: { results: [] } })),
        clientsAPI.getAll().catch(() => ({ data: { results: [] } })),
        usersAPI.getAll().catch(() => ({ data: { results: [] } })),
      ])

      setCases(casesRes.data.results || casesRes.data)
      setClients(clientsRes.data.results || clientsRes.data)
      // Filter only staff users (boss, employe)
      const staff = (usersRes.data.results || usersRes.data).filter(
        (u) => u.role === 'boss' || u.role === 'employe'
      )
      setStaffUsers(staff)
    } catch (error) {
      console.error('Error fetching data:', error)
      setCases([])
      setClients([])
      setStaffUsers([])
    } finally {
      setLoading(false)
    }
  }

  const getCaseStatusColor = (status) => {
    const colors = {
      open: 'primary',
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

  const handleOpenModal = (caseItem = null) => {
    if (caseItem) {
      setSelectedCase(caseItem)
      setFormData({
        client: caseItem.client?.id || caseItem.client || '',
        assigned_to: caseItem.assigned_to?.id || caseItem.assigned_to || '',
        title: caseItem.title || '',
        description: caseItem.description || '',
        case_type: caseItem.case_type || 'civil',
        status: caseItem.status || 'open',
        priority: caseItem.priority || 'medium',
        internal_notes: caseItem.internal_notes || '',
      })
    } else {
      setSelectedCase(null)
      setFormData({
        client: '',
        assigned_to: user?.id || '',
        title: '',
        description: '',
        case_type: 'civil',
        status: 'open',
        priority: 'medium',
        internal_notes: '',
      })
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCase(null)
    setFormData({
      client: '',
      assigned_to: '',
      title: '',
      description: '',
      case_type: 'civil',
      status: 'open',
      priority: 'medium',
      internal_notes: '',
    })
    setFormErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.client) {
      errors.client = 'Debe seleccionar un cliente'
    }
    if (!formData.assigned_to) {
      errors.assigned_to = 'Debe asignar el caso a un abogado'
    }
    if (!formData.title.trim()) {
      errors.title = 'El título es requerido'
    }
    if (!formData.description.trim()) {
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
        await casesAPI.create(formData)
      }
      await fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving case:', error)
      setFormErrors({
        general:
          error.response?.data?.message ||
          'Error al guardar el caso. Intenta nuevamente.',
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

  const filteredCases = cases.filter((caseItem) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      caseItem.title?.toLowerCase().includes(search) ||
      caseItem.case_number?.toLowerCase().includes(search) ||
      caseItem.client?.full_name?.toLowerCase().includes(search) ||
      caseItem.description?.toLowerCase().includes(search)

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
                  placeholder="Buscar casos..."
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
                <Table.HeaderCell>Caso</Table.HeaderCell>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Tipo</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Prioridad</Table.HeaderCell>
                <Table.HeaderCell>Asignado a</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </tr>
            </Table.Header>
            <Table.Body>
              {filteredCases.map((caseItem) => (
                <Table.Row key={caseItem.id}>
                  <Table.Cell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {caseItem.title}
                      </div>
                      {caseItem.case_number && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {caseItem.case_number}
                        </div>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {caseItem.client?.full_name || '-'}
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
                    {caseItem.assigned_to?.name || '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
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

              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Asignado a *
                </label>
                <select
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.assigned_to
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Seleccionar abogado</option>
                  {staffUsers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>
                {formErrors.assigned_to && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.assigned_to}
                  </p>
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
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.description
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Descripción detallada del caso..."
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
                <textarea
                  name="internal_notes"
                  value={formData.internal_notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  placeholder="Notas privadas sobre el caso..."
                />
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
    </div>
  )
}

export default CasesPage
