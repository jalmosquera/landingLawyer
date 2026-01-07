/**
 * Dashboard Home (Staff)
 *
 * Main dashboard page for staff members with statistics and quick actions.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  UserGroupIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Card, LoadingSpinner } from '../../components/ui'
import useAuthStore from '../../stores/authStore'
import { clientsAPI, casesAPI, documentsAPI, appointmentsAPI } from '../../services/api'

function DashboardHome() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    clients: 0,
    cases: 0,
    documents: 0,
    appointments: 0,
    pendingAppointments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // In a real app, we'd have a /api/dashboard/stats endpoint
      // For now, we'll fetch counts from each endpoint
      const [clientsRes, casesRes, documentsRes, appointmentsRes] = await Promise.all([
        clientsAPI.getAll().catch(() => ({ data: { results: [] } })),
        casesAPI.getAll().catch(() => ({ data: { results: [] } })),
        documentsAPI.getAll().catch(() => ({ data: { results: [] } })),
        appointmentsAPI.getAll().catch(() => ({ data: { results: [] } })),
      ])

      // Count pending appointments
      const allAppointments = appointmentsRes.data.results || appointmentsRes.data || []
      const pendingCount = Array.isArray(allAppointments)
        ? allAppointments.filter(apt => apt.status === 'pending').length
        : 0

      setStats({
        clients: clientsRes.data.results?.length || clientsRes.data.count || 0,
        cases: casesRes.data.results?.length || casesRes.data.count || 0,
        documents: documentsRes.data.results?.length || documentsRes.data.count || 0,
        appointments: appointmentsRes.data.results?.length || appointmentsRes.data.count || 0,
        pendingAppointments: pendingCount,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Clientes',
      value: stats.clients,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      link: '/dashboard/clients',
    },
    {
      name: 'Casos',
      value: stats.cases,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      link: '/dashboard/cases',
    },
    {
      name: 'Documentos',
      value: stats.documents,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      link: '/dashboard/documents',
    },
    {
      name: 'Citas',
      value: stats.appointments,
      icon: CalendarIcon,
      color: 'bg-purple-500',
      link: '/dashboard/appointments',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando estadísticas..." />
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
          Aquí tienes un resumen de tu despacho
        </p>
      </div>

      {/* Pending appointments alert */}
      {stats.pendingAppointments > 0 && (
        <Link to="/dashboard/appointments?status=pending" className="block mb-6">
          <Card className="border-l-4 border-accent bg-accent/5 dark:bg-accent/10 hover:bg-accent/10 dark:hover:bg-accent/20 transition-colors">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-accent p-3">
                      <ClockIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Citas por Aprobar
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Tienes {stats.pendingAppointments} solicitud{stats.pendingAppointments !== 1 ? 'es' : ''} de cita{stats.pendingAppointments !== 1 ? 's' : ''} pendiente{stats.pendingAppointments !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center">
                  <span className="text-3xl font-bold text-accent mr-4">
                    {stats.pendingAppointments}
                  </span>
                  <span className="text-accent font-medium">
                    Ver →
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.name} to={stat.link}>
              <Card hover padding={false} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {stat.value}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-primary dark:text-accent">
                      Ver todos →
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Acciones Rápidas</Card.Title>
            <Card.Subtitle>Operaciones frecuentes</Card.Subtitle>
          </Card.Header>
          <Card.Body>
            <div className="space-y-3">
              <Link
                to="/dashboard/clients"
                className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                  <span className="ml-3 font-medium text-gray-900 dark:text-white">
                    Agregar Cliente
                  </span>
                </div>
              </Link>
              <Link
                to="/dashboard/cases"
                className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <BriefcaseIcon className="h-6 w-6 text-gray-400" />
                  <span className="ml-3 font-medium text-gray-900 dark:text-white">
                    Crear Caso
                  </span>
                </div>
              </Link>
              <Link
                to="/dashboard/appointments"
                className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-6 w-6 text-gray-400" />
                  <span className="ml-3 font-medium text-gray-900 dark:text-white">
                    Agendar Cita
                  </span>
                </div>
              </Link>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Actividad Reciente</Card.Title>
            <Card.Subtitle>Últimas acciones del sistema</Card.Subtitle>
          </Card.Header>
          <Card.Body>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No hay actividad reciente</p>
              <p className="text-sm mt-2">La actividad aparecerá aquí</p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default DashboardHome
