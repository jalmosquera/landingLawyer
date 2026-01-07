# LandingLawyer CRM - Pendientes de Implementación

> **Última actualización:** 27 de diciembre de 2024
> **Estado:** Dashboard Staff funcional, falta Portal Cliente y Features Avanzadas

---

## 📊 Resumen del Estado Actual

### ✅ Completado (100%)

#### Backend
- ✅ **Modelos completos** para todas las apps (Users, Clients, Cases, Documents, Appointments, Landing)
- ✅ **APIs REST completas** con serializers y viewsets
- ✅ **Autenticación JWT** con roles (boss, employe, client)
- ✅ **Permisos por rol** (IsStaff, IsBoss, IsEmploye, IsClient)
- ✅ **Sistema de registro público** con auto-creación de Client
- ✅ **Password reset** con tokens por email
- ✅ **Upload de documentos** con validación de tipo y tamaño
- ✅ **Configuración de email** (SMTP)
- ✅ **Configuración de CORS** para frontend

#### Frontend Dashboard Staff
- ✅ **Autenticación completa** (Login, Logout, Protected Routes)
- ✅ **Layout con sidebar** y dark mode
- ✅ **Registro público** (página `/register`)
- ✅ **Página de Clientes** (CRUD completo)
  - Crear, editar, eliminar clientes
  - Búsqueda y filtrado
  - Notas internas con editor de texto enriquecido
  - Opción de crear acceso al portal al registrar cliente
- ✅ **Página de Casos** (CRUD completo)
  - Crear, editar, eliminar casos
  - Asignar casos a abogados
  - Búsqueda por cliente, tipo, estado, prioridad
  - **Gestión de documentos integrada:**
    - Subir documentos iniciales al crear caso
    - Ver documentos del caso en modal separado
    - Al editar caso: ver, descargar, eliminar documentos
    - Subir nuevos documentos sin cerrar el modal
  - Descripción y notas internas con editor de texto enriquecido
- ✅ **Página de Documentos** (gestión básica)
  - Subir documentos manualmente
  - Filtrar por cliente y caso
  - Ver metadata (tipo, tamaño, fecha)
  - Descripción con editor de texto enriquecido
- ✅ **Editor de texto enriquecido (RichTextEditor)**
  - Negrita, cursiva, subrayado
  - Listas ordenadas y con viñetas
  - Enlaces
  - Soporte completo para dark mode
  - Implementado en: descripción de casos, notas de casos, notas de clientes, descripción de documentos
- ✅ **Componentes UI reutilizables**
  - Button, Card, Table, Modal, LoadingSpinner, EmptyState, Badge, RichTextEditor

#### Frontend Landing Pública
- ✅ **Página principal** con información del abogado Eduardo Bernal Fernández
- ✅ **Header con navegación** responsive
- ✅ **Secciones:** Hero, About, Practice Areas, Testimonials, Footer
- ✅ **Botones de Login y Registro** en header

---

## ❌ Pendiente de Implementación

### 🔴 Alta Prioridad

#### 1. Sistema de Notificación de Documentos
**Flujo completo de 2 fases:**
1. Staff sube documento sensible → marca como `is_sensitive=true`
2. Staff presiona **"Avisar al Cliente"** en DocumentsPage
3. Backend genera:
   - Código de acceso de 6 dígitos (válido 24h)
   - Registro en `DocumentAccessToken`
4. Backend envía:
   - **Email** con código y link a verificación
   - **WhatsApp** abre wa.me con mensaje pre-escrito
5. Cliente ingresa código en `/portal/documents/verify`
6. Backend valida código → genera `download_token` (válido 1h)
7. Cliente descarga documento con token temporal
8. Todo queda registrado en `DocumentAccessLog`

**Archivos a crear/modificar:**
- `backend/apps/documents/api/views.py` → action `notify_client`
- `backend/apps/documents/services/notification.py` → NotificationService
- `backend/templates/emails/document_notification.html` → Template email
- `frontend/src/pages/dashboard/DocumentsPage.jsx` → Botón "Avisar al Cliente"
- `frontend/src/pages/portal/DocumentVerify.jsx` → Verificación de código

---

#### 2. Portal del Cliente
**Rutas nuevas:**
- `/portal/login` → Login separado para clientes
- `/portal/dashboard` → Vista de casos del cliente
- `/portal/cases/:id` → Detalle de caso con documentos
- `/portal/documents/verify` → Ingresar código 6 dígitos
- `/portal/documents/upload` → Subir documentos al caso
- `/portal/appointments` → Ver citas programadas

**Features:**
- Cliente ve solo sus propios casos
- Cliente ve documentos disponibles
- Cliente descarga documentos sensibles con código
- Cliente sube documentos requeridos (INE, comprobantes, evidencias)
- Cliente ve próximas citas

**Archivos a crear:**
- `frontend/src/pages/portal/PortalLogin.jsx`
- `frontend/src/pages/portal/PortalDashboard.jsx`
- `frontend/src/pages/portal/PortalCaseDetail.jsx`
- `frontend/src/pages/portal/DocumentVerify.jsx`
- `frontend/src/pages/portal/DocumentUpload.jsx`
- `frontend/src/pages/portal/PortalAppointments.jsx`
- `frontend/src/layouts/PortalLayout.jsx` → Layout específico para portal

**Backend endpoints necesarios:**
- `GET /api/portal/cases/` → Casos del cliente autenticado
- `GET /api/portal/cases/{id}/` → Detalle con documentos
- `POST /api/portal/documents/upload/` → Cliente sube documento
- `GET /api/portal/appointments/` → Citas del cliente

---

#### 3. Gestión de Appointments (Citas)
**Frontend Dashboard:**
- `frontend/src/pages/dashboard/AppointmentsPage.jsx`
  - Calendario visual (FullCalendar o react-big-calendar)
  - Vistas: día, semana, mes
  - Color-coded por status (pending: amarillo, confirmed: verde, cancelled: rojo)
  - Modal para crear/editar cita
  - Asignar a cliente/caso
  - Tipo: presencial, teléfono, videollamada
  - Notas internas
  - Botón "Sincronizar con Google Calendar"
  - Badge con solicitudes pendientes de aprobar

**Backend:**
- Ya existe el modelo `Appointment` y las APIs básicas
- **Falta:** Google Calendar integration

---

#### 4. Google Calendar Integration
**Service a crear:**
- `backend/apps/appointments/services/google_calendar.py`
  - `create_event()` → Crear evento en Google Calendar
  - `update_event()` → Actualizar evento existente
  - `delete_event()` → Eliminar evento
  - `sync_from_google()` → Sincronizar cambios desde Google
  - OAuth2 setup para autenticación

**Flujo:**
1. Staff crea cita → Se crea en DB y en Google Calendar
2. Staff edita cita → Se actualiza en ambos lados
3. Staff cancela cita → Se marca cancelada en ambos lados
4. **Webhook de Google** → Endpoint que recibe cambios externos

**Campos adicionales en Appointment:**
- `google_calendar_id` → ID del evento en Google
- `google_meet_link` → Link de videollamada (auto-generado)
- `last_sync_at` → Última sincronización

**Configuración necesaria:**
- Google Cloud Console → Crear proyecto y credenciales OAuth2
- Variables de entorno: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

---

### 🟡 Prioridad Media

#### 5. Calendario Público de Solicitud de Citas
**Landing Page:**
- Sección nueva en landing pública
- Calendario visual para seleccionar fecha
- Al seleccionar fecha → `GET /api/public/appointments/available-slots/?date=2024-12-27`
- Muestra slots disponibles (ej: 9am, 10am, 11am, etc.)
- Cliente selecciona slot → formulario con:
  - Nombre, email, teléfono
  - Tipo de cita (presencial/teléfono/video)
  - Mensaje opcional
- Submit → `POST /api/public/appointments/request/` con `status=pending`
- Mensaje de confirmación al cliente

**Backend endpoint:**
- `GET /api/public/appointments/available-slots/`
  - Calcula slots libres basándose en:
    - Citas existentes en DB
    - Eventos en Google Calendar
    - Horario de oficina (9am-6pm)
    - Duración de cita (default 1 hora)

**Archivos a crear:**
- `frontend/src/features/landing/PublicCalendar.jsx`
- Integrar en landing page

---

#### 6. Gestión de Contenido de Landing (Admin)
**Modelos ya creados en backend:**
- `Service` → Servicios ofrecidos
- `Testimonial` → Testimonios de clientes
- `SuccessCase` → Casos de éxito
- `ContactRequest` → Consultas desde formulario de contacto

**Frontend Dashboard - Páginas nuevas:**
- `frontend/src/pages/dashboard/ServicesPage.jsx`
  - CRUD de servicios
  - Orden (drag & drop opcional)
  - Activar/desactivar
  - Icono o imagen
- `frontend/src/pages/dashboard/TestimonialsPage.jsx`
  - CRUD de testimonios
  - Orden, rating (1-5 estrellas)
- `frontend/src/pages/dashboard/SuccessCasesPage.jsx`
  - CRUD de casos de éxito
  - Tipo de caso, resultado
- `frontend/src/pages/dashboard/ContactRequestsPage.jsx`
  - Ver consultas recibidas
  - Asignar a abogado
  - Cambiar status (new, in_progress, contacted, converted, closed)
  - Notas internas

**Frontend Landing - Integración con APIs:**
- Modificar landing para consumir `/api/public/services/`
- Modificar landing para consumir `/api/public/testimonials/`
- Agregar sección de casos de éxito
- Formulario de contacto → `POST /api/public/contact-requests/`

**Backend endpoints ya existentes:**
- `/api/public/services/` → Solo servicios activos
- `/api/public/testimonials/` → Solo testimonios activos
- `/api/landing/services/` → CRUD para staff
- `/api/landing/testimonials/` → CRUD para staff
- etc.

---

#### 7. Dashboard Principal con Estadísticas
**Página actual:** `/dashboard/home` es un placeholder

**Features a implementar:**
- Tarjetas de estadísticas:
  - Total de casos (abiertos, en progreso, cerrados)
  - Próximas citas (hoy, esta semana)
  - Documentos subidos (últimos 7 días)
  - Consultas nuevas sin asignar
- Gráficas (opcional):
  - Casos por tipo
  - Casos por estado
  - Citas por mes
- Lista de tareas pendientes:
  - Solicitudes de cita pendientes de confirmar
  - Consultas sin responder
  - Casos sin asignar

**Archivos a modificar:**
- `frontend/src/pages/dashboard/Home.jsx` → Implementar dashboard

**Backend endpoints necesarios:**
- `GET /api/dashboard/stats/` → Retorna estadísticas agregadas
  - Puede ser una vista custom en Django que haga los cálculos

---

### 🟢 Prioridad Baja (Post-MVP)

#### 8. Features Avanzadas
- **Notificaciones en tiempo real** (WebSockets con Django Channels)
- **Búsqueda avanzada** con filtros múltiples
- **Exportar datos** a PDF/Excel
- **Firma digital de documentos** (integración con DocuSign o similar)
- **Chat interno** staff-cliente
- **Plantillas de emails** personalizables desde dashboard
- **Multi-idioma** (español + inglés)
- **App móvil** nativa (React Native)
- **Métricas avanzadas**:
  - Tasa de conversión (consultas → casos)
  - Tiempo promedio de resolución
  - Satisfacción del cliente (encuestas post-caso)

---

## 🛠️ Decisiones de Diseño Importantes

### Arquitectura de Datos

#### 1. Relación User ↔ Client
**Decisión tomada:** Mantener tablas separadas
- **User:** Autenticación y permisos (login, roles, password)
- **Client:** Información legal (INE, CURP, RFC, notas internas, created_by)

**Razones:**
- Permite clientes sin acceso al portal
- Facilita auditoría (quién creó al cliente)
- Separa concerns (auth vs legal data)
- Registro público auto-crea ambos registros

**Implementación:**
- Al registrarse públicamente: se crea User + Client automáticamente
- Al crear cliente desde dashboard: se puede opcionalmente crear User
- Campo `client.user` es nullable (permite clientes sin portal)

---

#### 2. Documentos Iniciales vs Documentos Generados
**Distinción importante:**
- **Documentos tipo "evidence":**
  - Subidos al crear caso
  - Evidencia inicial del cliente (fotos, contratos, identificaciones)
  - Se pueden agregar más durante la edición del caso
- **Documentos tipo "resolution", "report":**
  - Subidos desde DocumentsPage
  - Generados por el abogado (resoluciones, informes, dictámenes)
  - Pueden marcarse como `is_sensitive=true` para requerir código

**Implementación:**
- CasesPage → Subir documentos con `document_type='evidence'`
- DocumentsPage → Subir documentos con tipo seleccionable
- Cliente en portal puede subir documentos tipo "evidence" a sus casos

---

#### 3. Sistema de Notificación de 2 Fases
**Flujo elegido:**
1. **Fase 1:** Código de acceso (6 dígitos, válido 24h)
   - Enviado por email + WhatsApp
   - Cliente lo ingresa en portal
   - Se registra en `DocumentAccessToken` con `token_type='access'`
2. **Fase 2:** Token de descarga (64 chars, válido 1h)
   - Generado al validar código
   - Usado una sola vez
   - Se marca como `used=True` después de descarga

**Seguridad:**
- Rate limiting: 10 intentos/minuto para prevenir brute force
- Tokens de un solo uso
- Auditoría completa en `DocumentAccessLog`
- IP tracking en cada intento

---

#### 4. Editor de Texto Enriquecido
**Librería elegida:** react-quill

**Features incluidas:**
- Negrita, cursiva, subrayado
- Listas ordenadas y con viñetas
- Enlaces
- Limpiar formato

**Implementado en:**
- Descripción de casos
- Notas internas de casos
- Notas internas de clientes
- Descripción de documentos

**Almacenamiento:** Contenido guardado como HTML en base de datos

**Validación:** Se remueven etiquetas HTML vacías antes de validar campo requerido

---

## 📂 Estructura de Archivos Actual

```
landingLawyer/
├── backend/
│   ├── apps/
│   │   ├── users/          ✅ Completo
│   │   ├── clients/        ✅ Completo
│   │   ├── cases/          ✅ Completo
│   │   ├── documents/      ⚠️ Falta notify_client action
│   │   ├── appointments/   ⚠️ Falta Google Calendar
│   │   └── landing/        ✅ Backend completo
│   ├── core/
│   │   ├── settings/       ✅ Configurado
│   │   ├── permissions.py  ✅ Completo
│   │   └── urls.py         ✅ Configurado
│   └── templates/
│       └── emails/         ❌ Falta crear templates
├── frontend/
│   ├── src/
│   │   ├── components/ui/  ✅ 8 componentes completos
│   │   ├── features/
│   │   │   ├── header/     ✅ Completo
│   │   │   ├── hero/       ✅ Completo
│   │   │   ├── about/      ✅ Completo
│   │   │   ├── footer/     ✅ Completo
│   │   │   └── practice-areas/ ✅ Completo
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx ✅ Completo
│   │   ├── pages/
│   │   │   ├── Login.jsx           ✅ Completo
│   │   │   ├── Register.jsx        ✅ Completo
│   │   │   ├── LandingPage.jsx     ✅ Completo
│   │   │   ├── dashboard/
│   │   │   │   ├── Home.jsx        ⚠️ Placeholder (falta estadísticas)
│   │   │   │   ├── ClientsPage.jsx ✅ Completo
│   │   │   │   ├── CasesPage.jsx   ✅ Completo
│   │   │   │   └── DocumentsPage.jsx ⚠️ Falta notify_client
│   │   │   └── portal/             ❌ No existe aún
│   │   ├── services/
│   │   │   └── api.js      ✅ Todos los endpoints definidos
│   │   └── stores/
│   │       └── authStore.js ✅ Completo
│   └── index.css           ✅ Con estilos de RichTextEditor
└── PENDIENTES.md           ✅ Este archivo
```

---

## 🚀 Próximos Pasos Recomendados

### Sprint 1: Sistema de Notificación de Documentos (2-3 días)
**Orden sugerido:**
1. Crear `DocumentAccessToken` y `DocumentAccessLog` models (si no existen)
2. Implementar `notify_client` action en DocumentViewSet
3. Crear `NotificationService` para email + WhatsApp
4. Crear template HTML `document_notification.html`
5. Agregar botón "Avisar al Cliente" en DocumentsPage
6. Crear página `DocumentVerify.jsx` en portal
7. Implementar endpoint público `validate-code`
8. Implementar endpoint público `download/{token}`
9. Probar flujo completo end-to-end

### Sprint 2: Portal del Cliente (3-4 días)
1. Crear `PortalLayout.jsx`
2. Crear `PortalLogin.jsx` (login separado)
3. Crear `PortalDashboard.jsx` (lista de casos)
4. Crear `PortalCaseDetail.jsx` (documentos del caso)
5. Implementar `DocumentUpload.jsx` (subir evidencias)
6. Crear `PortalAppointments.jsx` (ver citas)
7. Implementar endpoints de portal en backend
8. Probar acceso de cliente end-to-end

### Sprint 3: Appointments + Google Calendar (3-4 días)
1. Configurar Google Cloud Console (OAuth2)
2. Crear `google_calendar.py` service
3. Implementar creación de eventos
4. Implementar sincronización bidireccional
5. Crear `AppointmentsPage.jsx` con calendario
6. Implementar webhook para cambios externos
7. Endpoint de slots disponibles
8. Probar sincronización completa

### Sprint 4: Dashboard Principal (1-2 días)
1. Crear endpoint `/api/dashboard/stats/`
2. Implementar cálculos de estadísticas
3. Modificar `Home.jsx` con tarjetas de stats
4. Agregar gráficas (opcional)
5. Lista de tareas pendientes

### Sprint 5: Gestión de Contenido Landing (2-3 días)
1. Crear `ServicesPage.jsx`
2. Crear `TestimonialsPage.jsx`
3. Crear `SuccessCasesPage.jsx`
4. Crear `ContactRequestsPage.jsx`
5. Modificar landing para consumir APIs públicas
6. Agregar formulario de contacto en landing
7. Agregar sección de casos de éxito

### Sprint 6: Calendario Público (2-3 días)
1. Implementar endpoint `available-slots`
2. Crear `PublicCalendar.jsx`
3. Integrar en landing page
4. Formulario de solicitud de cita
5. Email de confirmación al cliente
6. Badge en dashboard con solicitudes pendientes

---

## 📝 Notas de Contexto para Próximas Sesiones

### Configuración Actual del Proyecto
- **Backend:** Django 4.2 + DRF + JWT
- **Frontend:** React 18 + Vite + TailwindCSS
- **Base de datos:** PostgreSQL (local)
- **Almacenamiento:** Local filesystem (`MEDIA_ROOT`)
- **Email:** Configurado con SMTP (Gmail/Brevo)
- **Dark mode:** Implementado en todo el dashboard

### Credenciales de Prueba
- **Admin:** username=`admin`, password=(el que definió el usuario)
- **Base URL Backend:** `http://localhost:8000`
- **Base URL Frontend:** `http://localhost:5173`

### Convenciones de Código
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.)
- **Idioma:** Todo en español (UI, mensajes, comentarios)
- **Estilos:** TailwindCSS con clases dark: para dark mode
- **Componentes:** Reutilizables en `components/ui/`
- **Páginas:** Separadas en `pages/dashboard/` y `pages/portal/`

### Problemas Conocidos Resueltos
1. ✅ **Users no aparecían en lista de clientes:** Se agregó auto-creación de Client al registrarse
2. ✅ **Case ID undefined al crear caso:** Se agregó `id` a `CaseCreateSerializer` fields
3. ✅ **Download abre about:blank:** Se agregó `file_url` a `DocumentMinimalSerializer`
4. ✅ **Descripción vacía pasaba validación:** Se agregó validación que remueve HTML tags

### Mejoras Futuras a Considerar
- Implementar drag & drop para upload de documentos (react-dropzone)
- Agregar preview de documentos PDF en modal
- Implementar paginación en tablas grandes
- Agregar filtros avanzados con múltiples criterios
- Implementar búsqueda global en dashboard
- Agregar notificaciones toast para feedback visual
- Implementar skeleton loaders para mejor UX
- Agregar animaciones con framer-motion
- Implementar modo offline con service workers

---

## 🎯 Objetivo Final

Un CRM completo para despacho de abogados donde:
1. ✅ Abogado gestiona clientes, casos y documentos desde dashboard
2. ❌ Abogado envía notificaciones seguras a clientes con código 6 dígitos
3. ❌ Cliente descarga documentos sensibles con código de acceso
4. ❌ Cliente sube documentos requeridos desde portal
5. ❌ Cliente solicita citas desde landing pública
6. ❌ Google Calendar sincronizado bidireccional
7. ✅ Landing pública con información del abogado
8. ❌ Dashboard de landing gestionable desde admin
9. ✅ Todo en español con dark mode
10. ✅ Sin dependencias externas de storage (local filesystem)

---

**Generado automáticamente por Claude Code**
**Versión:** 1.0
**Fecha:** 27 de diciembre de 2024
