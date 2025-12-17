/**
 * Document Verify Page
 *
 * Allows clients to verify their 6-digit access code and download sensitive documents.
 */

import { useState } from 'react'
import {
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { Card, Button, LoadingSpinner } from '../../components/ui'
import { documentsAPI } from '../../services/api'

function DocumentVerifyPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [downloadToken, setDownloadToken] = useState(null)
  const [documentInfo, setDocumentInfo] = useState(null)

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    setError('')
  }

  const handleVerify = async (e) => {
    e.preventDefault()

    if (code.length !== 6) {
      setError('Por favor ingresa un código de 6 dígitos')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await documentsAPI.validateCode({ access_code: code })

      if (response.data.success) {
        setDownloadToken(response.data.download_token)
        setDocumentInfo(response.data.document)
        setSuccess(true)
      } else {
        setError(response.data.message || 'Código inválido')
      }
    } catch (err) {
      console.error('Error validating code:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 400) {
        setError('Código inválido o expirado')
      } else if (err.response?.status === 429) {
        setError('Demasiados intentos. Por favor espera unos minutos.')
      } else {
        setError('Error al verificar el código. Por favor intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!downloadToken) return

    try {
      setLoading(true)
      const response = await documentsAPI.download(downloadToken)

      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', documentInfo?.original_filename || 'document.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      // Reset form
      setCode('')
      setDownloadToken(null)
      setDocumentInfo(null)
      setSuccess(false)
      setError('')
    } catch (err) {
      console.error('Error downloading document:', err)
      if (err.response?.status === 404) {
        setError('El enlace de descarga ha expirado. Por favor solicita un nuevo código.')
      } else {
        setError('Error al descargar el documento. Por favor intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setDownloadToken(null)
    setDocumentInfo(null)
    setSuccess(false)
    setError('')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Verificar Código de Acceso
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Ingresa el código de 6 dígitos que recibiste por email o WhatsApp
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Instructions Card */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Instrucciones
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• El código tiene 6 dígitos</li>
                  <li>• Lo recibiste por email y WhatsApp</li>
                  <li>• El código es válido por 24 horas</li>
                  <li>• Solo puedes usarlo una vez</li>
                  <li>• El enlace de descarga expira en 1 hora</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Verification Form */}
        <Card>
          <div className="p-6">
            {!success ? (
              <form onSubmit={handleVerify} className="space-y-6">
                {/* Code Input */}
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Código de Acceso
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent"
                    maxLength={6}
                    autoComplete="off"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {code.length}/6 dígitos
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  isLoading={loading}
                  disabled={code.length !== 6 || loading}
                >
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Verificar Código
                </Button>
              </form>
            ) : (
              /* Success State */
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    ¡Código Verificado!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Tu documento está listo para descargar
                  </p>
                </div>

                {/* Document Info */}
                {documentInfo && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {documentInfo.title}
                    </h4>
                    {documentInfo.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {documentInfo.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Warning */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Importante:</strong> El enlace de descarga expira en 1 hora.
                    Descarga tu documento ahora.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="success"
                    fullWidth
                    onClick={handleDownload}
                    isLoading={loading}
                    disabled={loading}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Descargar Documento
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={handleReset}
                    disabled={loading}
                  >
                    Verificar Otro Código
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              ¿No recibiste el código?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Si no has recibido el código de acceso, verifica tu bandeja de spam o
              contacta a tu abogado para solicitar un nuevo código.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Por razones de seguridad, los códigos expiran después de 24 horas y solo
              pueden usarse una vez.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DocumentVerifyPage
