/**
 * Clients Page
 *
 * CRUD page for managing clients.
 * Features: list, search, create, edit, delete.
 */

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
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
import { clientsAPI } from '../../services/api'

// Helper function to get identification type label
const getIdentificationTypeLabel = (type) => {
  const labels = {
    ine: 'INE/IFE',
    passport: 'Pasaporte',
    rfc: 'RFC',
    curp: 'CURP',
    other: 'Otro',
  }
  return labels[type] || type
}

function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    identification_type: 'ine',
    identification_number: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    notes: '',
    create_portal_access: false,
    portal_password: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await clientsAPI.getAll()
      setClients(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      // If API not ready, show empty state
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (client = null) => {
    if (client) {
      setSelectedClient(client)
      setFormData({
        full_name: client.full_name || '',
        email: client.email || '',
        phone: client.phone || '',
        identification_type: client.identification_type || 'ine',
        identification_number: client.identification_number || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        postal_code: client.postal_code || '',
        notes: client.notes || '',
        create_portal_access: false,
        portal_password: '',
      })
    } else {
      setSelectedClient(null)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        identification_type: 'ine',
        identification_number: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        notes: '',
        create_portal_access: false,
        portal_password: '',
      })
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedClient(null)
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      identification_type: 'ine',
      identification_number: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      notes: '',
      create_portal_access: false,
      portal_password: '',
    })
    setFormErrors({})
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const fieldValue = type === 'checkbox' ? checked : value
    setFormData((prev) => ({ ...prev, [name]: fieldValue }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.full_name.trim()) {
      errors.full_name = 'El nombre completo es requerido'
    }
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido'
    }
    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es requerido'
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
      if (selectedClient) {
        // Update
        await clientsAPI.update(selectedClient.id, formData)
      } else {
        // Create
        await clientsAPI.create(formData)
      }
      await fetchClients()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving client:', error)
      setFormErrors({
        general:
          error.response?.data?.message ||
          'Error al guardar el cliente. Intenta nuevamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (client) => {
    setClientToDelete(client)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      await clientsAPI.delete(clientToDelete.id)
      await fetchClients()
      setIsDeleteModalOpen(false)
      setClientToDelete(null)
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const filteredClients = clients.filter((client) => {
    const search = searchTerm.toLowerCase()
    return (
      client.full_name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.phone?.toLowerCase().includes(search) ||
      client.identification_number?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando clientes..." />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Clientes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gestiona la información de tus clientes
        </p>
      </div>

      {/* Actions bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-96">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
            onClick={() => handleOpenModal()}
          >
            Nuevo Cliente
          </Button>
        </div>
      </Card>

      {/* Clients table */}
      {filteredClients.length === 0 ? (
        <Card>
          <EmptyState
            title="No hay clientes"
            description={
              searchTerm
                ? 'No se encontraron clientes que coincidan con tu búsqueda'
                : 'Agrega tu primer cliente para comenzar'
            }
            actionLabel={!searchTerm ? 'Agregar Cliente' : undefined}
            onAction={!searchTerm ? () => handleOpenModal() : undefined}
          />
        </Card>
      ) : (
        <Card padding={false}>
          <Table>
            <Table.Header>
              <tr>
                <Table.HeaderCell>Nombre</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Teléfono</Table.HeaderCell>
                <Table.HeaderCell>Identificación</Table.HeaderCell>
                <Table.HeaderCell>Ciudad</Table.HeaderCell>
                <Table.HeaderCell>Acciones</Table.HeaderCell>
              </tr>
            </Table.Header>
            <Table.Body>
              {filteredClients.map((client) => (
                <Table.Row key={client.id}>
                  <Table.Cell>
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="font-bold text-primary hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 text-left transition-colors"
                    >
                      {client.full_name}
                    </button>
                  </Table.Cell>
                  <Table.Cell>{client.email}</Table.Cell>
                  <Table.Cell>{client.phone}</Table.Cell>
                  <Table.Cell>
                    <Badge variant="default" size="sm">
                      {getIdentificationTypeLabel(client.identification_type)} {client.identification_number}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{client.city || '-'}</Table.Cell>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(client)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded dark:text-blue-400 dark:hover:bg-gray-700"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(client)}
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
        title={selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}
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
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.full_name
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.full_name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.email
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                    formErrors.phone
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>

              {/* Identification Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Identificación
                </label>
                <select
                  name="identification_type"
                  value={formData.identification_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                >
                  <option value="ine">INE/IFE</option>
                  <option value="passport">Pasaporte</option>
                  <option value="rfc">RFC</option>
                  <option value="curp">CURP</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {/* Identification Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número de Identificación
                </label>
                <input
                  type="text"
                  name="identification_number"
                  value={formData.identification_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notas Internas
                </label>
                <RichTextEditor
                  value={formData.notes}
                  onChange={(content) => {
                    setFormData((prev) => ({ ...prev, notes: content }))
                  }}
                  placeholder="Notas privadas sobre el cliente..."
                />
              </div>

              {/* Portal Access - Only show when creating new client */}
              {!selectedClient && (
                <>
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="create_portal_access"
                        name="create_portal_access"
                        checked={formData.create_portal_access}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor="create_portal_access" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Crear acceso al portal del cliente
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Si activa esta opción, el cliente podrá iniciar sesión para ver sus casos y documentos
                    </p>
                  </div>

                  {/* Password field - Only show when create_portal_access is checked */}
                  {formData.create_portal_access && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contraseña para el Portal <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="portal_password"
                        value={formData.portal_password}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                          formErrors.portal_password
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Mínimo 8 caracteres"
                      />
                      {formErrors.portal_password && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.portal_password}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Esta contraseña será usada por el cliente para iniciar sesión. El nombre de usuario será generado automáticamente a partir del correo electrónico.
                      </p>
                    </div>
                  )}
                </>
              )}
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
              {selectedClient ? 'Guardar Cambios' : 'Crear Cliente'}
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
            ¿Estás seguro de que deseas eliminar a{' '}
            <span className="font-semibold">{clientToDelete?.full_name}</span>?
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
    </div>
  )
}

export default ClientsPage
