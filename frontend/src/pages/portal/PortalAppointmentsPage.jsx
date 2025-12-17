/**
 * Portal Appointments Page
 *
 * Allows clients to view their appointments.
 */

import { useState, useEffect } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  VideoCameraIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { Card, LoadingSpinner, Badge, EmptyState } from '../../components/ui'
import { portalAPI } from '../../services/api'

function PortalAppointmentsPage() {
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('upcoming')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await portalAPI.appointments.list().catch(() => ({ data: [] }))
      setAppointments(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
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
    return icons[type] || UserIcon
  }

  const getTypeLabel = (type) => {
    const labels = {
      in_person: 'Presencial',
      phone: 'Telefónica',
      video: 'Videollamada',
    }
    return labels[type] || type
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  const isPast = (dateString) => {
    return new Date(dateString) < new Date()
  }

  // Filter appointments
  let filteredAppointments = appointments

  // Filter by time (upcoming/past)
  if (timeFilter === 'upcoming') {
    filteredAppointments = filteredAppointments.filter((apt) =>
      isUpcoming(apt.starts_at)
    )
  } else if (timeFilter === 'past') {
    filteredAppointments = filteredAppointments.filter((apt) => isPast(apt.starts_at))
  }

  // Filter by status
  if (statusFilter !== 'all') {
    filteredAppointments = filteredAppointments.filter(
      (apt) => apt.status === statusFilter
    )
  }

  // Sort by date (upcoming: ascending, past: descending)
  filteredAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.starts_at)
    const dateB = new Date(b.starts_at)
    return timeFilter === 'past' ? dateB - dateA : dateA - dateB
  })

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mis Citas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Consulta tus citas programadas
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mostrar citas
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="upcoming">Próximas</option>
              <option value="past">Pasadas</option>
              <option value="all">Todas</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={CalendarIcon}
          title="No hay citas"
          description={
            timeFilter === 'upcoming'
              ? 'No tienes citas próximas programadas'
              : timeFilter === 'past'
              ? 'No tienes citas pasadas'
              : 'No tienes citas registradas'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((apt) => {
            const TypeIcon = getTypeIcon(apt.appointment_type)
            const upcoming = isUpcoming(apt.starts_at)

            return (
              <Card
                key={apt.id}
                className={`overflow-hidden ${
                  upcoming && apt.status === 'confirmed'
                    ? 'border-l-4 border-l-accent'
                    : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          upcoming && apt.status === 'confirmed'
                            ? 'bg-accent/10'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}
                      >
                        <CalendarIcon
                          className={`h-6 w-6 ${
                            upcoming && apt.status === 'confirmed'
                              ? 'text-accent'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {apt.title}
                          </h3>
                          {apt.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {apt.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={getStatusColor(apt.status)}>
                          {getStatusLabel(apt.status)}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {/* Date and Time */}
                        <div className="flex items-start gap-2">
                          <ClockIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-gray-900 dark:text-white font-medium">
                              {formatDateTime(apt.starts_at)}
                            </p>
                            {apt.ends_at && (
                              <p className="text-gray-500 dark:text-gray-400">
                                Hasta: {formatTime(apt.ends_at)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Type */}
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {getTypeLabel(apt.appointment_type)}
                          </span>
                        </div>
                      </div>

                      {/* Location/Link */}
                      {apt.location && apt.appointment_type === 'in_person' && (
                        <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-gray-700 dark:text-gray-300 font-medium">
                              Ubicación
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {apt.location}
                            </p>
                          </div>
                        </div>
                      )}

                      {apt.google_meet_link && apt.appointment_type === 'video' && (
                        <div className="mt-3">
                          <a
                            href={apt.google_meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
                          >
                            <VideoCameraIcon className="h-5 w-5" />
                            Unirse a la videollamada
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer - Show for upcoming confirmed appointments */}
                {upcoming && apt.status === 'confirmed' && (
                  <div className="bg-accent/5 dark:bg-accent/10 px-6 py-3 border-t border-accent/20">
                    <p className="text-sm text-accent dark:text-accent-light">
                      ⏰ Cita próxima confirmada
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PortalAppointmentsPage
