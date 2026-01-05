/**
 * Portal Documents Page
 *
 * Allows clients to view and download their documents.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import { Card, LoadingSpinner, Badge, EmptyState, Button } from '../../components/ui'
import { portalAPI } from '../../services/api'

function PortalDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState([])
  const [cases, setCases] = useState([])
  const [caseFilter, setCaseFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [documentsRes, casesRes] = await Promise.all([
        portalAPI.documents.list().catch(() => ({ data: [] })),
        portalAPI.cases.list().catch(() => ({ data: [] })),
      ])

      setDocuments(documentsRes.data.results || documentsRes.data || [])
      setCases(casesRes.data.results || casesRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDocumentTypeLabel = (type) => {
    const labels = {
      contract: 'Contrato',
      evidence: 'Evidencia',
      resolution: 'Resolución',
      report: 'Reporte',
      correspondence: 'Correspondencia',
      other: 'Otro',
    }
    return labels[type] || type
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

  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getCaseTitle = (caseId) => {
    const caseItem = cases.find((c) => c.id === caseId)
    return caseItem ? caseItem.title : 'Sin caso'
  }

  const filteredDocuments =
    caseFilter === 'all'
      ? documents
      : documents.filter((doc) => doc.case === parseInt(caseFilter))

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Mis Documentos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Descarga y consulta tus documentos
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filtrar por caso
          </label>
          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="all">Todos los casos</option>
            {cases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Info Card for Sensitive Documents */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="p-4 flex items-start gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">
              Documentos con código de acceso
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Algunos documentos requieren un código de 6 dígitos para su descarga.
              Recibirás este código por email y WhatsApp cuando un documento esté disponible.
            </p>
            <Link to="/documents/verify" className="inline-block mt-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                Verificar código de acceso →
              </span>
            </Link>
          </div>
        </div>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No hay documentos"
          description={
            caseFilter === 'all'
              ? 'No tienes documentos disponibles'
              : 'No hay documentos para este caso'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} hover className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <DocumentTextIcon className="h-5 w-5 text-accent" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {doc.title}
                        </h3>
                        {doc.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                      {doc.is_sensitive && (
                        <Badge variant="warning" size="sm" className="flex-shrink-0">
                          <ShieldCheckIcon className="h-3 w-3 mr-1 inline" />
                          Código requerido
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <div className="flex items-center gap-1">
                        <FolderIcon className="h-3.5 w-3.5" />
                        <span>{getCaseTitle(doc.case)}</span>
                      </div>
                      <span>•</span>
                      <Badge variant="default" size="sm">
                        {getDocumentTypeLabel(doc.document_type)}
                      </Badge>
                      <span>•</span>
                      <span>{formatDate(doc.uploaded_at)}</span>
                      {doc.file_size && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0">
                    {doc.is_sensitive ? (
                      <Link to="/documents/verify">
                        <Button variant="accent" size="sm">
                          <ShieldCheckIcon className="h-4 w-4 mr-1" />
                          Verificar
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="primary" size="sm">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              {doc.uploaded_by_client && (
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Documento subido por ti
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default PortalDocumentsPage
