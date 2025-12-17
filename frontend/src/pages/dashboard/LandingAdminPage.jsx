/**
 * Landing Admin Page
 *
 * Manage landing page content: services, testimonials, success cases, contact requests.
 * Features: tabs interface, CRUD operations for each content type.
 */

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  PhoneIcon,
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
import { landingAPI } from '../../services/api'

function LandingAdminPage() {
  const [activeTab, setActiveTab] = useState('services')
  const [loading, setLoading] = useState(true)

  // Services state
  const [services, setServices] = useState([])
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [serviceFormData, setServiceFormData] = useState({
    title: '',
    description: '',
    icon: '',
    order: 0,
    is_active: true,
  })

  // Testimonials state
  const [testimonials, setTestimonials] = useState([])
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState(null)
  const [testimonialFormData, setTestimonialFormData] = useState({
    client_name: '',
    text: '',
    rating: 5,
    date: new Date().toISOString().split('T')[0],
    order: 0,
    is_active: true,
  })

  // Contact Requests state
  const [contactRequests, setContactRequests] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'services') {
        const response = await landingAPI.services.getAll()
        setServices(response.data.results || response.data || [])
      } else if (activeTab === 'testimonials') {
        const response = await landingAPI.testimonials.getAll()
        setTestimonials(response.data.results || response.data || [])
      } else if (activeTab === 'requests') {
        const response = await landingAPI.contactRequests.getAll()
        setContactRequests(response.data.results || response.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Services handlers
  const handleOpenServiceModal = (service = null) => {
    if (service) {
      setSelectedService(service)
      setServiceFormData({
        title: service.title || '',
        description: service.description || '',
        icon: service.icon || '',
        order: service.order || 0,
        is_active: service.is_active !== undefined ? service.is_active : true,
      })
    } else {
      setSelectedService(null)
      setServiceFormData({
        title: '',
        description: '',
        icon: '',
        order: services.length,
        is_active: true,
      })
    }
    setFormErrors({})
    setIsServiceModalOpen(true)
  }

  const handleServiceSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!serviceFormData.title.trim()) errors.title = 'El título es requerido'
    if (!serviceFormData.description.trim())
      errors.description = 'La descripción es requerida'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsSubmitting(true)
      if (selectedService) {
        await landingAPI.services.update(selectedService.id, serviceFormData)
      } else {
        await landingAPI.services.create(serviceFormData)
      }
      await fetchData()
      setIsServiceModalOpen(false)
    } catch (error) {
      console.error('Error saving service:', error)
      setFormErrors({
        general: 'Error al guardar el servicio. Intenta nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteService = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio?'))
      return
    try {
      await landingAPI.services.delete(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const handleToggleServiceActive = async (service) => {
    try {
      await landingAPI.services.update(service.id, {
        ...service,
        is_active: !service.is_active,
      })
      await fetchData()
    } catch (error) {
      console.error('Error updating service:', error)
    }
  }

  // Testimonials handlers
  const handleOpenTestimonialModal = (testimonial = null) => {
    if (testimonial) {
      setSelectedTestimonial(testimonial)
      setTestimonialFormData({
        client_name: testimonial.client_name || '',
        text: testimonial.text || '',
        rating: testimonial.rating || 5,
        date: testimonial.date
          ? new Date(testimonial.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        order: testimonial.order || 0,
        is_active:
          testimonial.is_active !== undefined ? testimonial.is_active : true,
      })
    } else {
      setSelectedTestimonial(null)
      setTestimonialFormData({
        client_name: '',
        text: '',
        rating: 5,
        date: new Date().toISOString().split('T')[0],
        order: testimonials.length,
        is_active: true,
      })
    }
    setFormErrors({})
    setIsTestimonialModalOpen(true)
  }

  const handleTestimonialSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!testimonialFormData.client_name.trim())
      errors.client_name = 'El nombre es requerido'
    if (!testimonialFormData.text.trim())
      errors.text = 'El testimonio es requerido'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setIsSubmitting(true)
      if (selectedTestimonial) {
        await landingAPI.testimonials.update(
          selectedTestimonial.id,
          testimonialFormData
        )
      } else {
        await landingAPI.testimonials.create(testimonialFormData)
      }
      await fetchData()
      setIsTestimonialModalOpen(false)
    } catch (error) {
      console.error('Error saving testimonial:', error)
      setFormErrors({
        general: 'Error al guardar el testimonio. Intenta nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTestimonial = async (id) => {
    if (
      !window.confirm('¿Estás seguro de que deseas eliminar este testimonio?')
    )
      return
    try {
      await landingAPI.testimonials.delete(id)
      await fetchData()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
    }
  }

  const handleToggleTestimonialActive = async (testimonial) => {
    try {
      await landingAPI.testimonials.update(testimonial.id, {
        ...testimonial,
        is_active: !testimonial.is_active,
      })
      await fetchData()
    } catch (error) {
      console.error('Error updating testimonial:', error)
    }
  }

  // Contact Requests handlers
  const handleViewRequest = (request) => {
    setSelectedRequest(request)
    setIsRequestModalOpen(true)
  }

  const handleUpdateRequestStatus = async (id, status) => {
    try {
      await landingAPI.contactRequests.update(id, { status })
      await fetchData()
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const getRequestStatusColor = (status) => {
    const colors = {
      new: 'primary',
      in_progress: 'info',
      contacted: 'warning',
      converted: 'success',
      closed: 'default',
    }
    return colors[status] || 'default'
  }

  const getRequestStatusLabel = (status) => {
    const labels = {
      new: 'Nueva',
      in_progress: 'En Proceso',
      contacted: 'Contactado',
      converted: 'Convertido',
      closed: 'Cerrado',
    }
    return labels[status] || status
  }

  const tabs = [
    { id: 'services', label: 'Servicios' },
    { id: 'testimonials', label: 'Testimonios' },
    { id: 'requests', label: 'Consultas' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando..." />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Landing Admin
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona el contenido de la página pública
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary dark:text-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div>
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Los servicios aparecerán en la sección "Áreas de Práctica" de
                la landing page
              </p>
              <Button
                variant="primary"
                leftIcon={<PlusIcon className="h-5 w-5" />}
                onClick={() => handleOpenServiceModal()}
              >
                Nuevo Servicio
              </Button>
            </div>
          </Card>

          {services.length === 0 ? (
            <Card>
              <EmptyState
                title="No hay servicios"
                description="Agrega servicios para mostrar en la landing page"
                actionLabel="Agregar Servicio"
                onAction={() => handleOpenServiceModal()}
              />
            </Card>
          ) : (
            <Card padding={false}>
              <Table>
                <Table.Header>
                  <tr>
                    <Table.HeaderCell>Título</Table.HeaderCell>
                    <Table.HeaderCell>Descripción</Table.HeaderCell>
                    <Table.HeaderCell>Orden</Table.HeaderCell>
                    <Table.HeaderCell>Estado</Table.HeaderCell>
                    <Table.HeaderCell>Acciones</Table.HeaderCell>
                  </tr>
                </Table.Header>
                <Table.Body>
                  {services.map((service) => (
                    <Table.Row key={service.id}>
                      <Table.Cell>
                        <div className="font-medium">{service.title}</div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="max-w-md truncate">
                          {service.description}
                        </div>
                      </Table.Cell>
                      <Table.Cell>{service.order}</Table.Cell>
                      <Table.Cell>
                        {service.is_active ? (
                          <Badge variant="success" size="sm">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Inactivo
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleServiceActive(service)
                            }
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded dark:text-gray-400 dark:hover:bg-gray-700"
                            title={
                              service.is_active ? 'Desactivar' : 'Activar'
                            }
                          >
                            {service.is_active ? (
                              <EyeIcon className="h-5 w-5" />
                            ) : (
                              <EyeSlashIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenServiceModal(service)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
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
        </div>
      )}

      {/* Testimonials Tab */}
      {activeTab === 'testimonials' && (
        <div>
          <Card className="mb-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Los testimonios aparecerán en la sección de reseñas de la
                landing page
              </p>
              <Button
                variant="primary"
                leftIcon={<PlusIcon className="h-5 w-5" />}
                onClick={() => handleOpenTestimonialModal()}
              >
                Nuevo Testimonio
              </Button>
            </div>
          </Card>

          {testimonials.length === 0 ? (
            <Card>
              <EmptyState
                title="No hay testimonios"
                description="Agrega testimonios de clientes satisfechos"
                actionLabel="Agregar Testimonio"
                onAction={() => handleOpenTestimonialModal()}
              />
            </Card>
          ) : (
            <Card padding={false}>
              <Table>
                <Table.Header>
                  <tr>
                    <Table.HeaderCell>Cliente</Table.HeaderCell>
                    <Table.HeaderCell>Testimonio</Table.HeaderCell>
                    <Table.HeaderCell>Rating</Table.HeaderCell>
                    <Table.HeaderCell>Fecha</Table.HeaderCell>
                    <Table.HeaderCell>Estado</Table.HeaderCell>
                    <Table.HeaderCell>Acciones</Table.HeaderCell>
                  </tr>
                </Table.Header>
                <Table.Body>
                  {testimonials.map((testimonial) => (
                    <Table.Row key={testimonial.id}>
                      <Table.Cell>
                        <div className="font-medium">
                          {testimonial.client_name}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="max-w-md truncate">
                          {testimonial.text}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center">
                          {'⭐'.repeat(testimonial.rating || 0)}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(testimonial.date).toLocaleDateString(
                          'es-ES'
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {testimonial.is_active ? (
                          <Badge variant="success" size="sm">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Inactivo
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleToggleTestimonialActive(testimonial)
                            }
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded dark:text-gray-400 dark:hover:bg-gray-700"
                            title={
                              testimonial.is_active
                                ? 'Desactivar'
                                : 'Activar'
                            }
                          >
                            {testimonial.is_active ? (
                              <EyeIcon className="h-5 w-5" />
                            ) : (
                              <EyeSlashIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleOpenTestimonialModal(testimonial)
                            }
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteTestimonial(testimonial.id)
                            }
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
        </div>
      )}

      {/* Contact Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          <Card className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Solicitudes de consulta recibidas desde el formulario de contacto
            </p>
          </Card>

          {contactRequests.length === 0 ? (
            <Card>
              <EmptyState
                title="No hay consultas"
                description="Las consultas aparecerán aquí cuando los usuarios envíen el formulario de contacto"
              />
            </Card>
          ) : (
            <Card padding={false}>
              <Table>
                <Table.Header>
                  <tr>
                    <Table.HeaderCell>Nombre</Table.HeaderCell>
                    <Table.HeaderCell>Contacto</Table.HeaderCell>
                    <Table.HeaderCell>Asunto</Table.HeaderCell>
                    <Table.HeaderCell>Fecha</Table.HeaderCell>
                    <Table.HeaderCell>Estado</Table.HeaderCell>
                    <Table.HeaderCell>Acciones</Table.HeaderCell>
                  </tr>
                </Table.Header>
                <Table.Body>
                  {contactRequests.map((request) => (
                    <Table.Row key={request.id}>
                      <Table.Cell>
                        <div className="font-medium">{request.name}</div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <span>{request.phone}</span>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="max-w-xs truncate">
                          {request.subject || '-'}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(request.created_at).toLocaleDateString(
                          'es-ES'
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <select
                          value={request.status}
                          onChange={(e) =>
                            handleUpdateRequestStatus(
                              request.id,
                              e.target.value
                            )
                          }
                          className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                        >
                          <option value="new">Nueva</option>
                          <option value="in_progress">En Proceso</option>
                          <option value="contacted">Contactado</option>
                          <option value="converted">Convertido</option>
                          <option value="closed">Cerrado</option>
                        </select>
                      </Table.Cell>
                      <Table.Cell>
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* Service Modal */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={selectedService ? 'Editar Servicio' : 'Nuevo Servicio'}
        size="lg"
      >
        <form onSubmit={handleServiceSubmit}>
          <Modal.Body>
            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formErrors.general}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={serviceFormData.title}
                  onChange={(e) =>
                    setServiceFormData({
                      ...serviceFormData,
                      title: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.title
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ej: Derecho Penal"
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={serviceFormData.description}
                  onChange={(e) =>
                    setServiceFormData({
                      ...serviceFormData,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.description
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Descripción del servicio..."
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  value={serviceFormData.order}
                  onChange={(e) =>
                    setServiceFormData({
                      ...serviceFormData,
                      order: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={serviceFormData.is_active}
                    onChange={(e) =>
                      setServiceFormData({
                        ...serviceFormData,
                        is_active: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Activo (visible en la landing)
                  </span>
                </label>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={() => setIsServiceModalOpen(false)}
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
              {selectedService ? 'Guardar Cambios' : 'Crear Servicio'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Testimonial Modal */}
      <Modal
        isOpen={isTestimonialModalOpen}
        onClose={() => setIsTestimonialModalOpen(false)}
        title={
          selectedTestimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'
        }
        size="lg"
      >
        <form onSubmit={handleTestimonialSubmit}>
          <Modal.Body>
            {formErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formErrors.general}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  value={testimonialFormData.client_name}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      client_name: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.client_name
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ej: Juan Pérez"
                />
                {formErrors.client_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.client_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Testimonio *
                </label>
                <textarea
                  value={testimonialFormData.text}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      text: e.target.value,
                    })
                  }
                  rows="4"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.text
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Testimonio del cliente..."
                />
                {formErrors.text && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.text}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rating (1-5)
                </label>
                <select
                  value={testimonialFormData.rating}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      rating: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4)</option>
                  <option value={3}>⭐⭐⭐ (3)</option>
                  <option value={2}>⭐⭐ (2)</option>
                  <option value={1}>⭐ (1)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={testimonialFormData.date}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      date: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orden
                </label>
                <input
                  type="number"
                  value={testimonialFormData.order}
                  onChange={(e) =>
                    setTestimonialFormData({
                      ...testimonialFormData,
                      order: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testimonialFormData.is_active}
                    onChange={(e) =>
                      setTestimonialFormData({
                        ...testimonialFormData,
                        is_active: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Activo (visible en la landing)
                  </span>
                </label>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="ghost"
              onClick={() => setIsTestimonialModalOpen(false)}
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
              {selectedTestimonial ? 'Guardar Cambios' : 'Crear Testimonio'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Contact Request Detail Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Detalles de la Consulta"
        size="lg"
      >
        <Modal.Body>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nombre
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.name}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.email}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Teléfono
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {selectedRequest.phone}
                </p>
              </div>
              {selectedRequest.subject && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Asunto
                  </h4>
                  <p className="text-gray-900 dark:text-white">
                    {selectedRequest.subject}
                  </p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Mensaje
                </h4>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {selectedRequest.message}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de Solicitud
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedRequest.created_at).toLocaleString(
                    'es-ES'
                  )}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Estado
                </h4>
                <Badge
                  variant={getRequestStatusColor(selectedRequest.status)}
                >
                  {getRequestStatusLabel(selectedRequest.status)}
                </Badge>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="ghost"
            onClick={() => setIsRequestModalOpen(false)}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default LandingAdminPage
