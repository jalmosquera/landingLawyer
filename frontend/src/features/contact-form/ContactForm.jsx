import { useState, useEffect, useRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale'
import axios from 'axios'
import 'react-datepicker/dist/react-datepicker.css'

registerLocale('es', es)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })

  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [availableDates, setAvailableDates] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingDates, setLoadingDates] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const messageRef = useRef(null)

  // Fetch available dates on mount
  useEffect(() => {
    fetchAvailableDates()
  }, [])

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    } else {
      setAvailableSlots([])
      setSelectedSlot(null)
    }
  }, [selectedDate])

  const fetchAvailableDates = async () => {
    try {
      setLoadingDates(true)
      const response = await axios.get(
        `${API_BASE_URL}/public/appointments/available-dates/`,
        { params: { duration: 60, days_ahead: 60 } }
      )

      const dates = response.data.available_dates || []
      const parsedDates = dates.map(d => new Date(d.date + 'T12:00:00'))
      setAvailableDates(parsedDates)
    } catch (error) {
      console.error('Error fetching available dates:', error)
      setAvailableDates([])
    } finally {
      setLoadingDates(false)
    }
  }

  const fetchAvailableSlots = async (date) => {
    try {
      setLoadingSlots(true)
      // Use local date to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`

      const response = await axios.get(
        `${API_BASE_URL}/public/appointments/available-slots/`,
        { params: { date: dateStr, duration: 60 } }
      )

      const allSlots = response.data.slots || []

      // Group slots by time to avoid duplicates
      const groupedSlots = {}
      allSlots.forEach(slot => {
        if (slot.available) {
          const timeKey = slot.start_time
          if (!groupedSlots[timeKey]) {
            groupedSlots[timeKey] = { ...slot, lawyers: [] }
          }
          if (slot.lawyer_id) {
            groupedSlots[timeKey].lawyers.push({
              id: slot.lawyer_id,
              name: slot.lawyer_name
            })
          }
        }
      })

      const uniqueSlots = Object.values(groupedSlots)
      setAvailableSlots(uniqueSlots)
      setSelectedSlot(null)
    } catch (error) {
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    if (errors.slot) {
      setErrors((prev) => ({ ...prev, slot: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!selectedDate) {
      newErrors.date = 'Debe seleccionar una fecha'
    }

    if (!selectedSlot) {
      newErrors.slot = 'Debe seleccionar un horario'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true)
      setErrors({})

      try {
        await axios.post(`${API_BASE_URL}/public/appointments/request/`, {
          requested_by_name: formData.name,
          requested_by_email: formData.email,
          requested_by_phone: formData.phone || '',
          starts_at: selectedSlot.start_time,
          ends_at: selectedSlot.end_time,
          message: formData.message || '',
        })

        setSubmitSuccess(true)
        setFormData({ name: '', email: '', phone: '', message: '' })
        setSelectedDate(null)
        setSelectedSlot(null)

        // Scroll to message
        setTimeout(() => {
          messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)

        // Reset success message after 10 seconds
        setTimeout(() => {
          setSubmitSuccess(false)
        }, 10000)
      } catch (error) {
        console.error('Error submitting appointment request:', error)
        setErrors({
          submit: error.response?.data?.message ||
                  error.response?.data?.non_field_errors?.[0] ||
                  'Hubo un error al solicitar la cita. Por favor, inténtelo de nuevo.'
        })

        // Scroll to error message
        setTimeout(() => {
          messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setErrors(newErrors)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isDateAvailable = (date) => {
    return availableDates.some(
      availDate => availDate.toDateString() === date.toDateString()
    )
  }

  return (
    <section id="contact" className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Agende su Consulta Gratuita
            </h2>
            <p className="text-xl">
              Seleccione fecha y hora disponible para su consulta por Microsoft Teams.
              Le responderemos a la brevedad posible.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white text-gray-800 rounded-xl shadow-2xl p-8"
          >
            {/* Success Message */}
            {submitSuccess && (
              <div
                ref={messageRef}
                className="mb-6 p-6 bg-green-100 border-2 border-green-500 text-green-800 rounded-lg shadow-lg animate-pulse"
              >
                <p className="font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  ¡Solicitud de Cita Enviada con Éxito!
                </p>
                <p className="text-sm mt-2">
                  Recibirá un correo electrónico de confirmación pronto con los detalles de su cita por Microsoft Teams.
                </p>
                <p className="text-sm mt-1 font-semibold">
                  Revise su bandeja de entrada y spam.
                </p>
              </div>
            )}

            {/* General Error Message */}
            {errors.submit && (
              <div
                ref={messageRef}
                className="mb-6 p-6 bg-red-100 border-2 border-red-500 text-red-800 rounded-lg shadow-lg"
              >
                <p className="font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl">✗</span>
                  Error al Enviar la Solicitud
                </p>
                <p className="text-sm mt-2">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Juan Pérez"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="juan@ejemplo.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Phone Field */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-semibold mb-2">
                Número de Teléfono (Opcional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="+34 600 000 000"
              />
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Seleccione una Fecha *
              </label>
              {loadingDates ? (
                <div className="p-4 text-center text-gray-500">
                  Cargando fechas disponibles...
                </div>
              ) : (
                <div className="calendar-fullwidth">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    filterDate={isDateAvailable}
                    minDate={new Date()}
                    locale="es"
                    inline
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              )}
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Seleccione un Horario *
                </label>
                {loadingSlots ? (
                  <div className="p-4 text-center text-gray-500">
                    Cargando horarios disponibles...
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSlotSelect(slot)}
                        className={`p-3 rounded-lg border-2 font-medium transition-all ${
                          selectedSlot?.start_time === slot.start_time
                            ? 'border-accent bg-accent text-white'
                            : 'border-gray-300 hover:border-accent hover:bg-accent/10'
                        }`}
                      >
                        {formatTime(slot.start_time)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                    No hay horarios disponibles para esta fecha
                  </div>
                )}
                {errors.slot && (
                  <p className="text-red-500 text-sm mt-1">{errors.slot}</p>
                )}
              </div>
            )}

            {/* Message Field */}
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-semibold mb-2">
                Describa brevemente su caso (Opcional)
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Cuéntenos sobre su situación legal..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full btn-accent text-lg py-4 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Enviando Solicitud...' : 'Solicitar Cita'}
            </button>

            <p className="text-sm text-gray-500 text-center mt-4">
              * La cita será por Microsoft Teams. Recibirá un enlace por correo.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

export default ContactForm
