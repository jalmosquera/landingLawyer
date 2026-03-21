/**
 * Portal Appointments Page
 *
 * Allows clients to view their appointments.
 */

import { useState, useEffect } from "react";
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  VideoCameraIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  LoadingSpinner,
  Badge,
  EmptyState,
  Button,
  Modal,
} from "../../components/ui";
import { portalAPI, appointmentsAPI } from "../../services/api";
import useAuthStore from "../../stores/authStore";
import DatePicker, { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

// Registrar el locale español
registerLocale("es", es);

function PortalAppointmentsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");

  // Request modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await portalAPI.appointments
        .list()
        .catch(() => ({ data: [] }));
      setAppointments(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available dates when modal opens
  const fetchAvailableDates = async () => {
    try {
      const response = await appointmentsAPI.public.availableSlots({
        duration: 60,
        days_ahead: 60,
      });

      // Intenta extraer fechas únicas a partir de los slots recibidos
      const slots = response.data.slots || response.data.results || [];
      const uniqueDatesMap = new Map();

      slots.forEach((slot) => {
        const rawDate = slot.date || slot.start_time;
        if (!rawDate) return;

        const dateObj = new Date(rawDate);
        const key = dateObj.toDateString();

        if (!uniqueDatesMap.has(key)) {
          uniqueDatesMap.set(key, dateObj);
        }
      });

      setAvailableDates(Array.from(uniqueDatesMap.values()));
    } catch (error) {
      console.error("Error fetching available dates:", error);
      setAvailableDates([]);
    }
  };

  // Fetch available slots for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      setLoadingSlots(true);

      // Convert Date object to YYYY-MM-DD string
      const dateStr = selectedDate.toISOString().split("T")[0];

      const response = await appointmentsAPI.public.availableSlots({
        date: dateStr,
        duration: 60,
      });

      // Group slots by start_time to avoid duplicates from multiple lawyers
      const allSlots = response.data.slots || response.data.results || [];
      const groupedSlots = {};

      allSlots.forEach((slot) => {
        const timeKey = slot.start_time;
        if (!timeKey) return;

        if (!groupedSlots[timeKey]) {
          groupedSlots[timeKey] = {
            ...slot,
            lawyers: [],
          };
        }

        if (slot.lawyer_id) {
          groupedSlots[timeKey].lawyers.push({
            id: slot.lawyer_id,
            name: slot.lawyer_name,
          });
        }
      });

      // Convert back to array and keep only one slot per time
      const uniqueSlots = Object.values(groupedSlots);
      setAvailableSlots(uniqueSlots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      alert("Error al cargar horarios disponibles");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleRequestAppointment = async () => {
    if (!selectedSlot) {
      alert("Por favor selecciona un horario");
      return;
    }

    if (!user?.client_profile) {
      alert("No se pudo obtener información del cliente");
      return;
    }

    try {
      setSubmitting(true);

      // Get client info
      const clientInfo = user.client_profile;

      await appointmentsAPI.public.request({
        requested_by_name: clientInfo.full_name || user.name,
        requested_by_email: clientInfo.email || user.email,
        requested_by_phone: clientInfo.phone || "",
        starts_at: selectedSlot.start_time,
        ends_at: selectedSlot.end_time,
        message: requestMessage,
      });

      alert(
        "¡Solicitud enviada! El abogado revisará tu solicitud y te confirmará por correo.",
      );

      // Reset and close modal
      setIsRequestModalOpen(false);
      setSelectedDate(null);
      setSelectedSlot(null);
      setRequestMessage("");
      setAvailableSlots([]);
      setAvailableDates([]);

      // Refresh appointments list
      fetchData();
    } catch (error) {
      console.error("Error requesting appointment:", error);
      alert(error.response?.data?.detail || "Error al solicitar la cita");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      confirmed: "success",
      cancelled: "danger",
      completed: "default",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      completed: "Completada",
    };
    return labels[status] || status;
  };

  const getTypeIcon = (type) => {
    const icons = {
      in_person: MapPinIcon,
      phone: PhoneIcon,
      video: VideoCameraIcon,
    };
    return icons[type] || UserIcon;
  };

  const getTypeLabel = (type) => {
    const labels = {
      in_person: "Presencial",
      phone: "Telefónica",
      video: "Videollamada",
    };
    return labels[type] || type;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const isPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  // Filter appointments
  let filteredAppointments = appointments;

  // Filter by time (upcoming/past)
  if (timeFilter === "upcoming") {
    filteredAppointments = filteredAppointments.filter((apt) =>
      isUpcoming(apt.starts_at),
    );
  } else if (timeFilter === "past") {
    filteredAppointments = filteredAppointments.filter((apt) =>
      isPast(apt.starts_at),
    );
  }

  // Filter by status
  if (statusFilter !== "all") {
    filteredAppointments = filteredAppointments.filter(
      (apt) => apt.status === statusFilter,
    );
  }

  // Sort by date (upcoming: ascending, past: descending)
  filteredAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(a.starts_at);
    const dateB = new Date(b.starts_at);
    return timeFilter === "past" ? dateB - dateA : dateA - dateB;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Cargando citas..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mis Citas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Consulta tus citas programadas
          </p>
        </div>
        <Button
          onClick={() => {
            setIsRequestModalOpen(true);
            fetchAvailableDates();
          }}
          variant="primary"
          className="flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Solicitar Cita
        </Button>
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
            timeFilter === "upcoming"
              ? "No tienes citas próximas programadas"
              : timeFilter === "past"
                ? "No tienes citas pasadas"
                : "No tienes citas registradas"
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map((apt) => {
            const TypeIcon = getTypeIcon(apt.appointment_type);
            const upcoming = isUpcoming(apt.starts_at);

            return (
              <Card
                key={apt.id}
                className={`overflow-hidden ${
                  upcoming && apt.status === "confirmed"
                    ? "border-l-4 border-l-accent"
                    : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          upcoming && apt.status === "confirmed"
                            ? "bg-accent/10"
                            : "bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        <CalendarIcon
                          className={`h-6 w-6 ${
                            upcoming && apt.status === "confirmed"
                              ? "text-accent"
                              : "text-gray-500 dark:text-gray-400"
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
                      {apt.location && apt.appointment_type === "in_person" && (
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

                      {apt.google_meet_link &&
                        apt.appointment_type === "video" && (
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
                {upcoming && apt.status === "confirmed" && (
                  <div className="bg-accent/5 dark:bg-accent/10 px-6 py-3 border-t border-accent/20">
                    <p className="text-sm text-accent dark:text-accent-light">
                      ⏰ Cita próxima confirmada
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Request Appointment Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedDate(null);
          setSelectedSlot(null);
          setRequestMessage("");
          setAvailableSlots([]);
          setAvailableDates([]);
        }}
        title="Solicitar Cita"
        size="2xl"
      >
        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecciona una fecha
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
              minDate={new Date()}
              maxDate={new Date(new Date().setDate(new Date().getDate() + 60))}
              filterDate={(date) => {
                if (availableDates.length === 0) return true;
                return availableDates.some(
                  (availableDate) =>
                    availableDate.toDateString() === date.toDateString(),
                );
              }}
              locale="es"
              dateFormat="dd/MM/yyyy"
              inline
              calendarClassName="w-full"
            />
          </div>

          {/* Available Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horarios disponibles
              </label>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner text="Cargando horarios..." />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay horarios disponibles para esta fecha
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot, index) => {
                    const isSelected =
                      selectedSlot?.start_time === slot.start_time;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-gray-300 dark:border-gray-600 hover:border-accent/50 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span className="font-medium">
                            {new Date(slot.start_time).toLocaleTimeString(
                              "es-ES",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        {slot.lawyers && slot.lawyers.length > 1 && (
                          <div className="text-xs mt-1 opacity-75">
                            {slot.lawyers.length} disponibles
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {selectedSlot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mensaje (opcional)
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
                placeholder="Describe brevemente el motivo de la consulta..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={() => {
                setIsRequestModalOpen(false);
                setSelectedDate(null);
                setSelectedSlot(null);
                setRequestMessage("");
                setAvailableSlots([]);
                setAvailableDates([]);
              }}
              variant="secondary"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRequestAppointment}
              variant="primary"
              disabled={!selectedSlot || submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Enviando...
                </>
              ) : (
                "Enviar Solicitud"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PortalAppointmentsPage;
