/**
 * Portal Cases Page
 *
 * Allows clients to view their cases and associated documents.
 */

import { useState, useEffect } from 'react'
import {
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { Card, LoadingSpinner, Badge, EmptyState } from '../../components/ui'
import { portalAPI } from '../../services/api'

function PortalCasesPage() {
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState([])
  const [documents, setDocuments] = useState([])
  const [expandedCase, setExpandedCase] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [casesRes, documentsRes] = await Promise.all([
        portalAPI.cases.list().catch(() => ({ data: [] })),
        portalAPI.documents.list().catch(() => ({ data: [] })),
      ])

      setCases(casesRes.data.results || casesRes.data || [])
      setDocuments(documentsRes.data.results || documentsRes.data || [])
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

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    }
    return labels[priority] || priority
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'danger',
    }
    return colors[priority] || 'default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getCaseDocuments = (caseId) => {
    return documents.filter((doc) => doc.case === caseId)
  }

  const toggleCaseExpanded = (caseId) => {
    setExpandedCase(expandedCase === caseId ? null : caseId)
  }

  const filteredCases =
    statusFilter === 'all'
      ? cases
      : cases.filter((c) => c.status === statusFilter)

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mis Casos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Consulta el estado y documentos de tus casos
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filtrar por estado
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En Progreso</option>
            <option value="closed">Cerrado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
      </Card>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <EmptyState
          icon={BriefcaseIcon}
          title="No hay casos"
          description={
            statusFilter === 'all'
              ? 'No tienes casos registrados'
              : 'No hay casos con este estado'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredCases.map((caseItem) => {
            const caseDocuments = getCaseDocuments(caseItem.id)
            const isExpanded = expandedCase === caseItem.id

            return (
              <Card key={caseItem.id} className="overflow-hidden">
                {/* Case Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleCaseExpanded(caseItem.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <BriefcaseIcon className="h-5 w-5 text-accent flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {caseItem.title}
                        </h3>
                        {caseItem.case_number && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No. {caseItem.case_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="default" size="sm">
                        {getCaseTypeLabel(caseItem.case_type)}
                      </Badge>
                      <Badge variant={getPriorityColor(caseItem.priority)} size="sm">
                        Prioridad: {getPriorityLabel(caseItem.priority)}
                      </Badge>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Case Details (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800">
                      {/* Description */}
                      {caseItem.description && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {caseItem.description}
                          </p>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha de apertura
                          </h4>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatDate(caseItem.opened_at)}</span>
                          </div>
                        </div>
                        {caseItem.closed_at && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Fecha de cierre
                            </h4>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <ClockIcon className="h-4 w-4" />
                              <span>{formatDate(caseItem.closed_at)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Documents */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5" />
                          Documentos ({caseDocuments.length})
                        </h4>
                        {caseDocuments.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No hay documentos disponibles para este caso
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {caseDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-medium text-gray-900 dark:text-white truncate">
                                        {doc.title}
                                      </h5>
                                      {doc.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                          {doc.description}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        {formatDate(doc.uploaded_at)}
                                      </p>
                                    </div>
                                  </div>
                                  {doc.is_sensitive && (
                                    <Badge variant="warning" size="sm">
                                      Código requerido
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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

export default PortalCasesPage
