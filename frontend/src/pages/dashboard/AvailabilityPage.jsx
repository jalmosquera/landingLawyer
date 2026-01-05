/**
 * Availability Configuration Page
 *
 * Allows lawyers to configure their availability schedule.
 */

import { useState, useEffect } from 'react'
import { ClockIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Card, Button, LoadingSpinner } from '../../components/ui'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const DAYS_OF_WEEK = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
]

const SLOT_DURATIONS = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' },
]

function AvailabilityPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [weekData, setWeekData] = useState({})
  const [editingDay, setEditingDay] = useState(null)
  const [newSlot, setNewSlot] = useState({
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 60,
    is_active: true,
  })

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await axios.get(
        `${API_BASE_URL}/appointments/availability/week_view/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setWeekData(response.data)
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSlot = async (dayOfWeek) => {
    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')

      await axios.post(
        `${API_BASE_URL}/appointments/availability/`,
        {
          day_of_week: dayOfWeek,
          ...newSlot,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      await fetchAvailability()
      setEditingDay(null)
      setNewSlot({
        start_time: '09:00',
        end_time: '17:00',
        slot_duration_minutes: 60,
        is_active: true,
      })
    } catch (error) {
      console.error('Error adding slot:', error)
      alert(error.response?.data?.end_time?.[0] || 'Error al agregar horario')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('¿Eliminar este horario?')) return

    try {
      const token = localStorage.getItem('access_token')
      await axios.delete(
        `${API_BASE_URL}/appointments/availability/${slotId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      await fetchAvailability()
    } catch (error) {
      console.error('Error deleting slot:', error)
      alert('Error al eliminar horario')
    }
  }

  const handleToggleActive = async (slotId, currentStatus) => {
    try {
      const token = localStorage.getItem('access_token')
      await axios.patch(
        `${API_BASE_URL}/appointments/availability/${slotId}/`,
        { is_active: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      await fetchAvailability()
    } catch (error) {
      console.error('Error toggling slot:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando disponibilidad..." />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ClockIcon className="h-8 w-8 text-primary" />
          Configurar Disponibilidad
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Define tus horarios disponibles para citas por Microsoft Teams
        </p>
      </div>

      {/* Week View */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const slots = weekData[day.value] || []
          const isEditing = editingDay === day.value

          return (
            <Card key={day.value} className="overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {day.label}
                  </h3>
                  {!isEditing && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setEditingDay(day.value)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Agregar horario
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4">
                {/* Existing Slots */}
                {slots.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          slot.is_active
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Slots de {slot.slot_duration_minutes} min
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(slot.id, slot.is_active)}
                            className={`p-2 rounded-lg transition-colors ${
                              slot.is_active
                                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40'
                                : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={slot.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {slot.is_active ? (
                              <CheckIcon className="h-5 w-5" />
                            ) : (
                              <XMarkIcon className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isEditing && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Sin horarios configurados
                    </p>
                  )
                )}

                {/* Add New Slot Form */}
                {isEditing && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hora inicio
                        </label>
                        <input
                          type="time"
                          value={newSlot.start_time}
                          onChange={(e) =>
                            setNewSlot({ ...newSlot, start_time: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hora fin
                        </label>
                        <input
                          type="time"
                          value={newSlot.end_time}
                          onChange={(e) =>
                            setNewSlot({ ...newSlot, end_time: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Duración de slots
                        </label>
                        <select
                          value={newSlot.slot_duration_minutes}
                          onChange={(e) =>
                            setNewSlot({
                              ...newSlot,
                              slot_duration_minutes: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {SLOT_DURATIONS.map((duration) => (
                            <option key={duration.value} value={duration.value}>
                              {duration.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end gap-2">
                        <Button
                          variant="primary"
                          onClick={() => handleAddSlot(day.value)}
                          disabled={saving}
                          className="flex-1"
                        >
                          {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => setEditingDay(null)}
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default AvailabilityPage
