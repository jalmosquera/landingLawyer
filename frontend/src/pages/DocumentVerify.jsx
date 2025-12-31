/**
 * Document Verification Page
 *
 * Public page where clients can enter their 6-digit access code
 * to download sensitive documents sent by their lawyer.
 *
 * Flow:
 * 1. Client receives email/WhatsApp with 6-digit code
 * 2. Client enters code + email on this page
 * 3. System validates code and generates download token
 * 4. Client can download the document
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DocumentTextIcon,
  KeyIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Button, Card, LoadingSpinner } from '../components/ui'
import { documentsAPI } from '../services/api'
import useAuthStore from '../stores/authStore'

function DocumentVerify() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  // Form state
  const [formData, setFormData] = useState({
    access_code: '',
    email: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Download state
  const [documents, setDocuments] = useState([]) // Array of documents
  const [downloadingTokens, setDownloadingTokens] = useState(new Set()) // Track which are being downloaded
  const [downloadedTokens, setDownloadedTokens] = useState(new Set()) // Track which have been downloaded

  // Auto-fill email if user is logged in
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email }))
    }
  }, [isAuthenticated, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.access_code.trim()) {
      newErrors.access_code = 'El código de acceso es requerido'
    } else if (formData.access_code.length !== 6) {
      newErrors.access_code = 'El código debe tener 6 dígitos'
    } else if (!/^\d{6}$/.test(formData.access_code)) {
      newErrors.access_code = 'El código debe contener solo números'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      setIsSubmitting(true)
      setErrors({})

      console.log('Enviando validación:', formData)
      const response = await documentsAPI.validateCode(formData)
      console.log('Respuesta recibida:', response.data)

      // Store documents list
      if (response.data.documents && response.data.documents.length > 0) {
        setDocuments(response.data.documents)
      } else {
        setErrors({
          general: 'No se encontraron documentos disponibles con este código.',
        })
      }
    } catch (error) {
      console.error('Error validando código:', error)
      console.error('Detalles del error:', error.response?.data)

      if (error.response?.status === 404) {
        setErrors({
          general: 'Código de acceso inválido o ya utilizado',
        })
      } else if (error.response?.status === 410) {
        setErrors({
          general:
            'El código de acceso ha expirado. Solicita uno nuevo a tu abogado.',
        })
      } else if (error.response?.status === 403) {
        setErrors({
          general: 'El email no coincide con el destinatario del código',
        })
      } else if (error.response?.status === 400) {
        setErrors({
          general:
            error.response?.data?.detail ||
            error.response?.data?.error ||
            Object.values(error.response?.data || {}).flat().join('. ') ||
            'Datos inválidos. Verifica el código y el email.',
        })
      } else {
        setErrors({
          general:
            error.response?.data?.detail ||
            'Error al validar el código. Intenta nuevamente.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownload = async (document) => {
    if (!document?.download_token) return

    try {
      // Mark as downloading
      setDownloadingTokens((prev) => new Set([...prev, document.download_token]))

      const response = await documentsAPI.download(document.download_token)

      // Get content type from response headers or default to PDF
      const contentType = response.headers['content-type'] || 'application/pdf'

      // Create blob with correct MIME type
      const blob = new Blob([response.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Use original filename to preserve extension
      link.download = document.original_filename || document.document_title || 'documento.pdf'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Mark as downloaded
      setDownloadedTokens((prev) => new Set([...prev, document.download_token]))
    } catch (error) {
      console.error('Error downloading document:', error)

      if (error.response?.status === 404) {
        setErrors({
          general: 'Token de descarga inválido o ya utilizado',
        })
      } else if (error.response?.status === 410) {
        setErrors({
          general:
            'El token de descarga ha expirado. Valida tu código nuevamente.',
        })
      } else {
        setErrors({
          general: 'Error al descargar el documento. Intenta nuevamente.',
        })
      }
    } finally {
      // Remove from downloading set
      setDownloadingTokens((prev) => {
        const newSet = new Set(prev)
        newSet.delete(document.download_token)
        return newSet
      })
    }
  }

  const formatExpiresAt = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-primary dark:text-blue-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Verificar Documento
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              size="sm"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {documents.length === 0 && (
          <Card>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <KeyIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ingresar Código de Acceso
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ingresa el código de 6 dígitos que recibiste por email o WhatsApp
              </p>
            </div>

            {isAuthenticated && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Sesión activa detectada</p>
                  <p className="text-xs mt-1">
                    Tu email ({user?.email}) se usará automáticamente para la
                    verificación
                  </p>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {errors.general}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="access_code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Código de Acceso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="access_code"
                    name="access_code"
                    value={formData.access_code}
                    onChange={handleChange}
                    placeholder="123456"
                    maxLength={6}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                      errors.access_code
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.access_code && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.access_code}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email de Verificación
                  {isAuthenticated && (
                    <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                      ✓ Detectado automáticamente
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    readOnly={isAuthenticated}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white ${
                      isAuthenticated
                        ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed'
                        : ''
                    } ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
                {isAuthenticated ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Usando tu email de sesión actual
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ingresa el mismo email al que te llegó el código
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verificando...' : 'Verificar Código'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 text-sm">
                  ¿No recibiste tu código?
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Contacta a tu abogado para solicitar un nuevo código de acceso.
                  El código es válido por 24 horas desde su envío.
                </p>
              </div>
            </div>
          </Card>
        )}

        {documents.length > 0 && (
          <Card>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Código Verificado
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {documents.length} documento{documents.length > 1 ? 's' : ''} disponible{documents.length > 1 ? 's' : ''} para descargar
              </p>
            </div>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">
                  {errors.general}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Importante:</strong> Los enlaces de descarga expiran en 1 hora. Cada documento solo puede descargarse una vez.
              </p>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
              {documents.map((doc, index) => {
                const isDownloading = downloadingTokens.has(doc.download_token)
                const isDownloaded = downloadedTokens.has(doc.download_token)

                return (
                  <div
                    key={doc.download_token}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      <DocumentTextIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                          {doc.document_title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {doc.original_filename}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Expira: {formatExpiresAt(doc.expires_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isDownloaded ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">Descargado</span>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            isLoading={isDownloading}
                            disabled={isDownloading}
                            leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                          >
                            {isDownloading ? 'Descargando...' : 'Descargar'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setDocuments([])
                  setDownloadedTokens(new Set())
                  setDownloadingTokens(new Set())
                  setFormData({ access_code: '', email: '' })
                  setErrors({})
                }}
              >
                Verificar Otro Código
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>
                Volver al Inicio
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Sistema seguro de verificación de documentos
          </p>
        </div>
      </footer>
    </div>
  )
}

export default DocumentVerify
