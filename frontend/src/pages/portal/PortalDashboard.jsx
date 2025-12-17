/**
 * Portal Dashboard (Client)
 *
 * Main dashboard for clients to view their cases, documents, and appointments.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Card, LoadingSpinner, Badge } from '../../components/ui'
import useAuthStore from '../../stores/authStore'
import { portalAPI } from '../../services/api'

function PortalDashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])
  const [documents, setDocuments] = useState([])
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [casesRes, documentsRes, appointmentsRes] = await Promise.all([
        portalAPI.cases.list().catch(() => ({ data: [] })),
        portalAPI.documents.list().catch(() => ({ data: [] })),
        portalAPI.appointments.list().catch(() => ({ data: [] })),
      ])

      setCases(casesRes.data.results || casesRes.data || [])
      setDocuments(documentsRes.data.results || documentsRes.data || [])
      setAppointments(appointmentsRes.data.results || appointmentsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
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

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      closed: 'Cerrado',
      archived: 'Archivado',
    }
    return labels[status] || status
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get upcoming appointments
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.starts_at) > new Date())
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 3)

  // Get recent documents
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
    .slice(0, 3)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando información..." />
      </div>
    )
  }

  return (
    <div>
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenido, {user?.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Aquí puedes ver el estado de tus casos y documentos
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link to="/portal/cases">
          <Card hover padding={false} className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-blue-500">
                  <BriefcaseIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Mis Casos
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {cases.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
              <div className="text-sm">
                <span className="font-medium text-accent">Ver casos →</span>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/portal/documents">
          <Card hover padding={false} className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-yellow-500">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Documentos
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {documents.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
              <div className="text-sm">
                <span className="font-medium text-accent">Ver documentos →</span>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/portal/appointments">
          <Card hover padding={false} className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md p-3 bg-purple-500">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Próximas Citas
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {upcomingAppointments.length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
              <div className="text-sm">
                <span className="font-medium text-accent">Ver citas →</span>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cases */}
        <Card>
          <Card.Header>
            <Card.Title>Mis Casos</Card.Title>
            <Card.Subtitle>Estado de tus casos activos</Card.Subtitle>
          </Card.Header>
          <Card.Body>
            {cases.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No tienes casos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.slice(0, 3).map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/portal/cases`}
                    className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {caseItem.title}
                        </h4>
                        {caseItem.case_number && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {caseItem.case_number}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={getCaseStatusColor(caseItem.status)}
                        size="sm"
                      >
                        {getStatusLabel(caseItem.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
                {cases.length > 3 && (
                  <Link
                    to="/portal/cases"
                    className="block text-center text-sm text-accent hover:text-accent-dark font-medium pt-2"
                  >
                    Ver todos los casos →
                  </Link>
                )}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Recent Documents */}
        <Card>
          <Card.Header>
            <Card.Title>Documentos Recientes</Card.Title>
            <Card.Subtitle>Últimos documentos disponibles</Card.Subtitle>
          </Card.Header>
          <Card.Body>
            {recentDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No hay documentos disponibles</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {documents.length > 3 && (
                  <Link
                    to="/portal/documents"
                    className="block text-center text-sm text-accent hover:text-accent-dark font-medium pt-2"
                  >
                    Ver todos los documentos →
                  </Link>
                )}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="lg:col-span-2">
          <Card.Header>
            <Card.Title>Próximas Citas</Card.Title>
            <Card.Subtitle>Tus citas programadas</Card.Subtitle>
          </Card.Header>
          <Card.Body>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No tienes citas programadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      <ClockIcon className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {apt.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {formatDateTime(apt.starts_at)}
                        </p>
                        {apt.location && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {apt.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default PortalDashboard
