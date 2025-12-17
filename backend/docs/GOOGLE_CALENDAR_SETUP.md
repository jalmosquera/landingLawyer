# Configuración de Google Calendar API

Este documento describe cómo configurar la integración con Google Calendar para sincronizar citas automáticamente.

## 🎯 Propósito

La integración con Google Calendar permite:
- ✅ Crear eventos automáticamente en Google Calendar cuando se confirma una cita
- ✅ Actualizar eventos cuando se modifican las citas
- ✅ Eliminar eventos cuando se cancelan las citas
- ✅ Generar enlaces de Google Meet automáticamente para videollamadas
- ✅ Sincronización bidireccional (opcional con webhooks)

## 📋 Requisitos Previos

- Cuenta de Google (Gmail, G Suite, Google Workspace)
- Acceso a [Google Cloud Console](https://console.cloud.google.com/)

## 🔧 Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente:
   - Haz clic en el selector de proyectos en la parte superior
   - Click en "Nuevo Proyecto"
   - Nombre del proyecto: `LandingLawyer` (o el nombre de tu bufete)
   - Haz clic en "Crear"

## 🔑 Paso 2: Habilitar Google Calendar API

1. En el menú lateral, ve a **APIs y Servicios** > **Biblioteca**
2. Busca "Google Calendar API"
3. Haz clic en "Google Calendar API"
4. Haz clic en el botón **"Habilitar"**

## 🔐 Paso 3: Crear Credenciales OAuth 2.0

1. Ve a **APIs y Servicios** > **Credenciales**
2. Haz clic en **"Crear credenciales"** > **"ID de cliente de OAuth"**
3. Si es tu primera vez, deberás configurar la pantalla de consentimiento:

### Configurar Pantalla de Consentimiento

1. Haz clic en **"Configurar pantalla de consentimiento"**
2. Selecciona **"Externo"** (o "Interno" si usas Google Workspace)
3. Completa la información:
   - **Nombre de la aplicación**: LandingLawyer CRM
   - **Correo electrónico de asistencia**: tu email
   - **Dominio de la aplicación**: (opcional) tu dominio
   - **Correo electrónico del desarrollador**: tu email
4. Haz clic en **"Guardar y continuar"**
5. En **Alcances**, haz clic en **"Agregar o quitar alcances"**
6. Agrega los siguientes alcances:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   ```
7. Haz clic en **"Actualizar"** y luego **"Guardar y continuar"**
8. En **Usuarios de prueba** (si seleccionaste "Externo"), agrega tu email
9. Haz clic en **"Guardar y continuar"**
10. Revisa y haz clic en **"Volver al panel"**

### Crear Credenciales

1. Regresa a **Credenciales** > **"Crear credenciales"** > **"ID de cliente de OAuth"**
2. Selecciona tipo de aplicación: **"Aplicación web"**
3. Configura:
   - **Nombre**: LandingLawyer Backend
   - **Orígenes autorizados de JavaScript**: (dejar vacío por ahora)
   - **URIs de redireccionamiento autorizados**:
     ```
     http://localhost:8000/api/google/callback
     https://tudominio.com/api/google/callback
     ```
4. Haz clic en **"Crear"**
5. **IMPORTANTE**: Guarda el **ID de cliente** y el **Secreto del cliente**

## 🔌 Paso 4: Configurar Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```bash
# Google Calendar API
GOOGLE_CLIENT_ID=tu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_secreto_de_cliente_aqui
GOOGLE_REDIRECT_URI=http://localhost:8000/api/google/callback
```

**Para producción:**
```bash
GOOGLE_REDIRECT_URI=https://tudominio.com/api/google/callback
```

## 🔄 Paso 5: Flujo de Autenticación OAuth 2.0

La integración actual en el código es un **placeholder**. Para implementar la autenticación completa:

### Opción 1: Autenticación Manual (Recomendado para inicio)

1. **Instalar biblioteca de Google**:
   ```bash
   pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
   ```

2. **Actualizar `requirements.txt`**:
   ```bash
   echo "google-auth==2.23.0" >> backend/requirements.txt
   echo "google-auth-oauthlib==1.1.0" >> backend/requirements.txt
   echo "google-auth-httplib2==0.1.1" >> backend/requirements.txt
   echo "google-api-python-client==2.100.0" >> backend/requirements.txt
   ```

3. **Crear endpoint de autorización** en `apps/appointments/api/views.py`:
   ```python
   from google_auth_oauthlib.flow import Flow
   from google.auth.transport.requests import Request
   from google.oauth2.credentials import Credentials
   import os

   @action(detail=False, methods=['get'])
   def google_auth(self, request):
       """Iniciar flujo de autenticación de Google."""
       flow = Flow.from_client_config(
           {
               "web": {
                   "client_id": settings.GOOGLE_CLIENT_ID,
                   "client_secret": settings.GOOGLE_CLIENT_SECRET,
                   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                   "token_uri": "https://oauth2.googleapis.com/token",
                   "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
               }
           },
           scopes=['https://www.googleapis.com/auth/calendar']
       )
       flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

       authorization_url, state = flow.authorization_url(
           access_type='offline',
           include_granted_scopes='true'
       )

       # Guardar state en sesión o base de datos
       request.session['google_auth_state'] = state

       return Response({
           'authorization_url': authorization_url
       })

   @action(detail=False, methods=['get'])
   def google_callback(self, request):
       """Callback de Google OAuth."""
       state = request.session.get('google_auth_state')

       flow = Flow.from_client_config(
           {
               "web": {
                   "client_id": settings.GOOGLE_CLIENT_ID,
                   "client_secret": settings.GOOGLE_CLIENT_SECRET,
                   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                   "token_uri": "https://oauth2.googleapis.com/token",
                   "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
               }
           },
           scopes=['https://www.googleapis.com/auth/calendar'],
           state=state
       )
       flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

       # Obtener token
       flow.fetch_token(authorization_response=request.build_absolute_uri())

       credentials = flow.credentials

       # Guardar credenciales en base de datos o archivo
       # Para simplificar, guardar en archivo:
       with open('token.json', 'w') as token:
           token.write(credentials.to_json())

       return Response({
           'success': True,
           'message': 'Autenticación exitosa'
       })
   ```

4. **Actualizar `GoogleCalendarService`** para usar las credenciales guardadas:
   ```python
   from google.oauth2.credentials import Credentials
   from googleapiclient.discovery import build

   def get_calendar_service(self):
       """Get authenticated Google Calendar service."""
       creds = None

       # Cargar credenciales desde archivo
       if os.path.exists('token.json'):
           creds = Credentials.from_authorized_user_file('token.json', SCOPES)

       # Si no hay credenciales válidas, retornar None
       if not creds or not creds.valid:
           if creds and creds.expired and creds.refresh_token:
               creds.refresh(Request())
               # Guardar credenciales actualizadas
               with open('token.json', 'w') as token:
                   token.write(creds.to_json())
           else:
               return None

       return build('calendar', 'v3', credentials=creds)
   ```

### Opción 2: Cuenta de Servicio (Recomendado para producción)

1. En Google Cloud Console, ve a **Credenciales**
2. Haz clic en **"Crear credenciales"** > **"Cuenta de servicio"**
3. Completa la información y haz clic en **"Crear"**
4. Descarga el archivo JSON de la cuenta de servicio
5. Agrega a `.env`:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_FILE=path/to/service-account.json
   ```

6. **Compartir calendario** con la cuenta de servicio:
   - Abre Google Calendar
   - Configuración > Compartir con personas específicas
   - Agrega el email de la cuenta de servicio (termina en `@*.iam.gserviceaccount.com`)
   - Otorga permisos de "Hacer cambios en eventos"

## ✅ Paso 6: Probar la Integración

Una vez configuradas las credenciales, puedes probar:

```bash
# Iniciar servidor
python manage.py runserver

# En el navegador, ve a:
http://localhost:8000/api/appointments/google-auth/

# Autoriza la aplicación
# Regresará al callback y guardará las credenciales

# Ahora puedes crear una cita y se sincronizará automáticamente
```

## 📝 Endpoints Disponibles

Una vez implementado OAuth 2.0:

- `GET /api/appointments/google-auth/` - Iniciar autenticación
- `GET /api/appointments/google-callback/` - Callback OAuth
- `POST /api/appointments/{id}/sync-google/` - Sincronizar cita específica
- `POST /api/appointments/bulk-sync/` - Sincronizar todas las citas

## 🔒 Seguridad

- ✅ **NO** subas `token.json` o el archivo de cuenta de servicio a Git
- ✅ Agrega a `.gitignore`:
  ```
  token.json
  service-account-*.json
  ```
- ✅ En producción, almacena tokens en base de datos encriptada
- ✅ Usa HTTPS para el redirect URI en producción

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Verifica que el URI de redirección en `.env` coincida **exactamente** con el configurado en Google Cloud Console
- Incluye el protocolo (`http://` o `https://`)
- No incluyas trailing slash

### Error: "invalid_grant"
- Las credenciales expiraron
- Elimina `token.json` y vuelve a autenticar

### Error: "Access blocked: This app's request is invalid"
- Verifica que la pantalla de consentimiento esté publicada
- Agrega tu email como usuario de prueba

### Error: "Calendar API has not been used in project"
- Asegúrate de haber habilitado Google Calendar API en el proyecto

## 📚 Recursos Adicionales

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Python Quickstart](https://developers.google.com/calendar/api/quickstart/python)

## 🎯 Estado Actual

El código actual tiene un **placeholder** en `apps/appointments/services/google_calendar.py` que:
- ✅ Define la estructura de métodos
- ✅ Retorna respuestas simuladas
- ⏳ Requiere implementación de OAuth 2.0 real

Para implementación completa, sigue las instrucciones de **Opción 1** o **Opción 2** arriba.
