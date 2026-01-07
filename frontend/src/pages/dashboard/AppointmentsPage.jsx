/**
 * Appointments Page
 *
 * Appointment management page with calendar and scheduling.
 * Features: list, create, edit, filter by date and status.
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  PlusIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  VideoCameraIcon,
  PhoneIcon,
  MapPinIcon,
  UserCircleIcon,
  BriefcaseIcon,
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
import { appointmentsAPI, clientsAPI, casesAPI } from '../../services/api'

function AppointmentsPage() {
  const location = useLocation()
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewAppointment, setViewAppointment] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    client: '',
    case: '',
    starts_at: '',
    ends_at: '',
    title: '',
    description: '',
    appointment_type: 'in_person',
    status: 'pending',
    location: '',
    internal_notes: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check URL params for initial status filter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('status')
    if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      setStatusFilter(status)
    }
  }, [location.search])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [appointmentsRes, clientsRes, casesRes] = await Promise.all([
        appointmentsAPI.getAll().catch(() => ({ data: { results: [] } })),
        clientsAPI.getAll().catch(() => ({ data: { results: [] } })),
        casesAPI.getAll().catch(() => ({ data: { results: [] } })),
      ])

      setAppointments(appointmentsRes.data.results || appointmentsRes.data)
      setClients(clientsRes.data.results || clientsRes.data)
      setCases(casesRes.data.results || casesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      setAppointments([])
      setClients([])
      setCases([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'success',
      cancelled: 'danger',
      completed: 'default',
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
    }
    return labels[status] || status
  }

  const getTypeIcon = (type) => {
    const icons = {
      in_person: MapPinIcon,
      phone: PhoneIcon,
      video: VideoCameraIcon,
    }
    return icons[type] || MapPinIcon
  }

  const getTypeLabel = (type) => {
    const labels = {
      in_person: 'Presencial',
      phone: 'Teléfono',
      video: 'Videollamada',
      teams: 'Microsoft Teams',
    }
    return labels[type] || type
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleOpenModal = (appointment = null) => {
    if (appointment) {
      setSelectedAppointment(appointment)

      // Debug: Log appointment data
      console.log('Opening appointment for edit:', appointment)
      console.log('Client value:', appointment.client)
      console.log('Client data:', appointment.client_data)
      console.log('Client type:', typeof appointment.client)
      console.log('Is public request:', appointment.is_public_request)
      console.log('Requested by name:', appointment.requested_by_name)

      // Extract client ID - handle multiple cases:
      // 1. client is null (public request) -> try to find matching client by name
      // 2. client is a number (ID) -> use it
      // 3. client is an object -> extract id
      // 4. client_data exists -> extract id from there
      let clientId = null
      if (appointment.client !== null && appointment.client !== undefined) {
        clientId = typeof appointment.client === 'object'
          ? appointment.client?.id
          : appointment.client
      } else if (appointment.client_data) {
        clientId = appointment.client_data.id
      } else if (appointment.requested_by_name) {
        // No client assigned but has requested_by_name -> try to find matching client
        console.log('Searching for client with name:', appointment.requested_by_name)
        const matchingClient = clients.find(
          c => c.full_name?.toLowerCase() === appointment.requested_by_name?.toLowerCase()
        )
        if (matchingClient) {
          clientId = matchingClient.id
          console.log('✅ Found matching client by name:', matchingClient.full_name, 'ID:', clientId)
        } else {
          console.log('❌ No matching client found for name:', appointment.requested_by_name)
          console.log('Available client names:', clients.map(c => c.full_name))
        }
      }

      // Extract case ID - same logic
      let caseId = null
      if (appointment.case !== null && appointment.case !== undefined) {
        caseId = typeof appointment.case === 'object'
          ? appointment.case?.id
          : appointment.case
      } else if (appointment.case_data) {
        caseId = appointment.case_data.id
      }

      // Convert to string for select compatibility
      const clientIdString = clientId ? String(clientId) : ''
      const caseIdString = caseId ? String(caseId) : ''

      console.log('Extracted client ID:', clientId, '-> String:', clientIdString)
      console.log('Extracted case ID:', caseId, '-> String:', caseIdString)
      console.log('Available clients:', clients.map(c => ({ id: c.id, name: c.full_name })))

      setFormData({
        client: clientIdString,
        case: caseIdString,
        starts_at: appointment.starts_at
          ? new Date(appointment.starts_at).toISOString().slice(0, 16)
          : '',
        ends_at: appointment.ends_at
          ? new Date(appointment.ends_at).toISOString().slice(0, 16)
          : '',
        title: appointment.title || '',
        description: appointment.description || '',
        appointment_type: appointment.appointment_type || 'in_person',
        status: appointment.status || 'pending',
        location: appointment.location || '',
        internal_notes: appointment.internal_notes || '',
      })
    } else {
      setSelectedAppointment(null)
      // Set default start time to next hour
      const now = new Date()
      now.setHours(now.getHours() + 1, 0, 0, 0)
      const startTime = now.toISOString().slice(0, 16)
      // Set default end time to 1 hour after start
      now.setHours(now.getHours() + 1)
      const endTime = now.toISOString().slice(0, 16)

      setFormData({
        client: '',
        case: '',
        starts_at: startTime,
        ends_at: endTime,
        title: '',
        description: '',
        appointment_type: 'in_person',
        status: 'pending',
        location: '',
        internal_notes: '',
      })
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAppointment(null)
    setFormErrors({})
  }

  const handleViewAppointment = (appointment) => {
    setViewAppointment(appointment)
    setIsViewModalOpen(true)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setViewAppointment(null)
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
    if (!formData.starts_at) {
      errors.starts_at = 'La fecha de inicio es requerida'
    }
    if (!formData.ends_at) {
      errors.ends_at = 'La fecha de fin es requerida'
    }
    if (!formData.title.trim()) {
      errors.title = 'El título es requerido'
    }
    if (formData.starts_at && formData.ends_at) {
      if (new Date(formData.ends_at) <= new Date(formData.starts_at)) {
        errors.ends_at = 'La fecha de fin debe ser posterior a la de inicio'
      }
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
      const submitData = {
        ...formData,
        client: formData.client || null,
        case: formData.case || null,
      }

      if (selectedAppointment) {
        await appointmentsAPI.update(selectedAppointment.id, submitData)
      } else {
        await appointmentsAPI.create(submitData)
      }
      await fetchData()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving appointment:', error)
      setFormErrors({
        general:
          error.response?.data?.message ||
          'Error al guardar la cita. Intenta nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (appointment) => {
    setAppointmentToDelete(appointment)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await appointmentsAPI.delete(appointmentToDelete.id)
      await fetchData()
      setIsDeleteModalOpen(false)
      setAppointmentToDelete(null)
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus =
      statusFilter === 'all' || apt.status === statusFilter

    const matchesClient =
      clientFilter === 'all' || apt.client === parseInt(clientFilter)

    let matchesDate = true
    if (dateFilter !== 'all') {
      const now = new Date()
      const aptDate = new Date(apt.starts_at)

      if (dateFilter === 'today') {
        matchesDate =
          aptDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'week') {
        const weekFromNow = new Date(now)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        matchesDate = aptDate >= now && aptDate <= weekFromNow
      } else if (dateFilter === 'month') {
        const monthFromNow = new Date(now)
        monthFromNow.setMonth(monthFromNow.getMonth() + 1)
        matchesDate = aptDate >= now && aptDate <= monthFromNow
      }
    }

    return matchesStatus && matchesDate && matchesClient
  })

  // Sort by start time
  const sortedAppointments = [...filteredAppointments].sort(
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando citas..." />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Citas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona las citas con tus clientes
        </p>
      </div>

      {/* Actions bar */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Próxima semana</option>
              <option value="month">Próximo mes</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
            onClick={() => handleOpenModal()}
          >
            Nueva Cita
          </Button>
        </div>
      </Card>

      {/* Appointments list */}
      {sortedAppointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarIcon}
            title="No hay citas"
            description={
              dateFilter !== 'all' || statusFilter !== 'all' || clientFilter !== 'all'
                ? 'No se encontraron citas con los filtros seleccionados'
                : 'Agenda tu primera cita para comenzar'
            }
            actionLabel={
              dateFilter === 'all' && statusFilter === 'all' && clientFilter === 'all'
                ? 'Agendar Cita'
                : undefined
            }
            onAction={
              dateFilter === 'all' && statusFilter === 'all' && clientFilter === 'all'
                ? () => handleOpenModal()
                : undefined
            }
          />
        </Card>
      ) : (
        <Card padding={false}>
          <Table>
            <Table.Header>
              <tr>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Cita</Table.HeaderCell>
                <Table.HeaderCell>Fecha y Hora</Table.HeaderCell>
                <Table.HeaderCell>Tipo</Table.HeaderCell>
                <Table.HeaderCell>Estado</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </tr>
            </Table.Header>
            <Table.Body>
              {sortedAppointments.map((apt) => {
                const TypeIcon = getTypeIcon(apt.appointment_type)
                return (
                  <Table.Row key={apt.id}>
                    <Table.Cell>
                      <button
                        onClick={() => handleViewAppointment(apt)}
                        className="text-left hover:underline text-primary dark:text-blue-400 font-medium"
                      >
                        {apt.client_data?.full_name || apt.requested_by_name || '-'}
                      </button>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {apt.title}
                        </div>
                        {apt.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {apt.description}
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <div className="text-sm font-medium">
                          {formatDate(apt.starts_at)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(apt.starts_at)} -{' '}
                          {formatTime(apt.ends_at)}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {getTypeLabel(apt.appointment_type)}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        variant={getStatusColor(apt.status)}
                        size="sm"
                      >
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(apt)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(apt)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded dark:text-red-400 dark:hover:bg-gray-700"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedAppointment ? 'Editar Cita' : 'Nueva Cita'}
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
                {selectedAppointment?.is_public_request && !formData.client && (
                  <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-300">
                    <strong>Solicitud pública:</strong> {selectedAppointment.requested_by_name || 'Sin nombre'} ({selectedAppointment.requested_by_email || 'Sin email'})
                    <br />
                    <span className="text-yellow-700 dark:text-yellow-400">Asigna un cliente a esta cita</span>
                  </div>
                )}
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
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.client}
                  </p>
                )}
              </div>

              {/* Case (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caso (Opcional)
                </label>
                <select
                  name="case"
                  value={formData.case}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sin caso específico</option>
                  {cases.map((caseItem) => (
                    <option key={caseItem.id} value={caseItem.id}>
                      {caseItem.case_number || caseItem.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título de la Cita *
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
                  placeholder="Ej: Consulta inicial sobre divorcio"
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.starts_at
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.starts_at && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.starts_at}
                  </p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha y Hora de Fin *
                </label>
                <input
                  type="datetime-local"
                  name="ends_at"
                  value={formData.ends_at}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.ends_at
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.ends_at && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.ends_at}
                  </p>
                )}
              </div>

              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Cita
                </label>
                <select
                  name="appointment_type"
                  value={formData.appointment_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="in_person">Presencial</option>
                  <option value="phone">Teléfono</option>
                  <option value="video">Videollamada</option>
                  <option value="teams">Microsoft Teams</option>
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
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              {/* Location (if in-person) */}
              {formData.appointment_type === 'in_person' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                    placeholder="Dirección del despacho o lugar de reunión"
                  />
                </div>
              )}

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  placeholder="Detalles de la cita..."
                />
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
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  placeholder="Notas privadas sobre la cita..."
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={handleCloseModal}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {selectedAppointment ? 'Guardar Cambios' : 'Crear Cita'}
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
            ¿Estás seguro de que deseas eliminar la cita{' '}
            <span className="font-semibold">{appointmentToDelete?.title}</span>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Esta acción no se puede deshacer.
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

      {/* View Appointment Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        title="Detalles de la Cita"
        size="xl"
      >
        <Modal.Body>
          {viewAppointment && (
            <div className="space-y-6">
              {/* Header Card - Cliente y Estado */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        Cliente
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {viewAppointment.client_data?.full_name || viewAppointment.requested_by_name || '-'}
                    </h3>
                    {viewAppointment.case_data && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <BriefcaseIcon className="h-4 w-4" />
                        <span>{viewAppointment.case_data.case_number} - {viewAppointment.case_data.title}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={getStatusColor(viewAppointment.status)} size="lg">
                    {getStatusLabel(viewAppointment.status)}
                  </Badge>
                </div>
              </div>

              {/* Título de la Cita */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Título de la Cita
                    </h4>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {viewAppointment.title}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fecha, Hora y Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fecha y Hora Inicio */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Inicio
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDateTime(viewAppointment.starts_at)}
                  </p>
                </div>

                {/* Fecha y Hora Fin */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Fin
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDateTime(viewAppointment.ends_at)}
                  </p>
                </div>

                {/* Tipo de Cita */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const TypeIcon = getTypeIcon(viewAppointment.appointment_type)
                      return <TypeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    })()}
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Tipo
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getTypeLabel(viewAppointment.appointment_type)}
                  </p>
                </div>
              </div>

              {/* Ubicación */}
              {viewAppointment.location && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Ubicación
                      </h4>
                      <p className="text-base text-gray-900 dark:text-white">
                        {viewAppointment.location}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Microsoft Teams Link */}
              {viewAppointment.teams_meeting_link && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <VideoCameraIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Microsoft Teams
                      </h4>
                      <a
                        href={viewAppointment.teams_meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <VideoCameraIcon className="h-4 w-4" />
                        Unirse a la reunión
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Descripción */}
              {viewAppointment.description && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Descripción
                      </h4>
                      <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {viewAppointment.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas Internas */}
              {viewAppointment.internal_notes && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-5 border-2 border-amber-200 dark:border-amber-800 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
                      <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 uppercase tracking-wide">
                        Notas Internas (Confidencial)
                      </h4>
                      <p className="text-base text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                        {viewAppointment.internal_notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onClick={handleCloseViewModal}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCloseViewModal()
              handleOpenModal(viewAppointment)
            }}
          >
            Editar Cita
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AppointmentsPage
