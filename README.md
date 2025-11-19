# landingLawyer

> Professional legal platform for managing clients, appointments, and secure document delivery.

[![Django](https://img.shields.io/badge/Django-5.2.3-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.16.0-red.svg)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.5-38bdf8.svg)](https://tailwindcss.com/)

[English](#english) | [Español](#español)

---

## English

### 📋 Project Overview

landingLawyer is a comprehensive digital platform designed for legal professionals to centralize client communication, manage appointments seamlessly, and deliver legal documents securely without depending on traditional messaging apps like WhatsApp.

### ✨ Key Features

#### 🎯 Current Features (Implemented)

- ✅ **Professional Landing Page**
  - Hero section with compelling call-to-action
  - Practice areas showcase
  - Client testimonials
  - Contact form
  - Responsive design with custom color scheme (Navy #013048 & Gold #fbb03c)

- ✅ **Backend Infrastructure**
  - Django 5.2.3 + Django REST Framework 3.16
  - PostgreSQL database with complete migrations
  - JWT authentication system
  - API documentation with Swagger/ReDoc (drf-spectacular)
  - Modular app architecture (users, clients, reports, tokens, appointments, landing)

- ✅ **Development Environment**
  - Monorepo structure (backend/ + frontend/)
  - Feature-Sliced Design architecture for frontend
  - Ruff for Python linting and formatting
  - pytest configuration for testing
  - Docker support
  - GitHub Actions CI/CD pipeline

#### 🚀 Planned Features (Coming Soon)

- 🔨 **Client Management System**
  - Complete CRUD operations for client records
  - Contact information and case notes
  - Communication logs and history
  - Advanced search and filtering

- 🔨 **Appointment Scheduling**
  - Google Calendar integration
  - Automatic Google Meet link generation
  - Email notifications for appointments
  - Conflict detection and availability checking
  - No personal phone number exposure

- 🔨 **Secure Document Delivery**
  - Token-based access control (no client login required)
  - Unique, time-limited access tokens
  - AWS S3 integration for PDF storage
  - Pre-signed URLs for secure downloads
  - Download tracking and audit logs
  - Configurable expiration dates
  - Single-use or multi-use token options

- 🔨 **Admin Dashboard**
  - Client management interface
  - Report upload and organization
  - Appointment calendar view
  - Token generation and management
  - Communication logs viewer
  - Analytics and statistics

- 🔨 **Email Notifications**
  - Brevo integration (300 emails/day free tier)
  - Appointment confirmations
  - Document availability alerts
  - Reminder notifications

### 🏗️ Tech Stack

#### Backend
- **Framework**: Django 5.2.3 + Django REST Framework 3.16.0
- **Database**: PostgreSQL (SQLite for development)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **API Docs**: drf-spectacular (Swagger/ReDoc)
- **File Storage**: AWS S3 + django-storages
- **Testing**: pytest + pytest-django
- **Linting**: Ruff
- **Server**: Gunicorn + Whitenoise

#### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Styling**: TailwindCSS 3.3.5
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **Icons**: React Icons + Heroicons
- **HTTP Client**: Axios

#### External Services
- **Calendar**: Google Calendar API v3
- **Email**: Brevo API (300 emails/day free tier)
- **File Storage**: AWS S3 (5GB free tier)
- **Deployment**: Railway (backend) + Vercel (frontend)

### 📦 Project Structure

```
landingLawyer/
├── backend/                    # Django backend
│   ├── apps/                   # Django applications
│   │   ├── users/             # User management & JWT auth
│   │   ├── clients/           # Client records & notes
│   │   ├── reports/           # Legal reports management
│   │   ├── tokens/            # Secure access tokens
│   │   ├── appointments/      # Scheduling & Google Calendar
│   │   └── landing/           # Contact form handling
│   ├── core/                   # Django project settings
│   ├── manage.py
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── ruff.toml
│   └── Dockerfile
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── features/          # Feature-Sliced Design
│   │   │   ├── auth/
│   │   │   ├── clients/
│   │   │   ├── reports/
│   │   │   ├── appointments/
│   │   │   └── landing/
│   │   ├── shared/            # Shared components & utils
│   │   ├── pages/             # Page components
│   │   ├── store/             # Zustand stores
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── .github/
│   └── workflows/             # CI/CD pipelines
├── docs/                       # Documentation
├── docker-compose.yml
└── README.md
```

### 🚀 Getting Started

#### Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ (optional for development)
- Git

#### Installation

1. **Clone the repository**
```bash
git clone https://github.com/jalmosquera/landingLawyer.git
cd landingLawyer
```

2. **Backend Setup**
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Copy environment file
cp backend/.env.example backend/.env

# Run migrations
python backend/manage.py migrate

# Create superuser
python backend/manage.py createsuperuser

# Run development server
python backend/manage.py runserver
```

3. **Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run development server
npm run dev
```

### 🔑 Environment Variables

#### Backend (.env)
```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/landinglawyer

# AWS S3
USE_S3=False
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=landinglawyer-reports
AWS_S3_REGION_NAME=us-east-1

# Google Calendar API
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Brevo Email
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@landinglawyer.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000/api
```

### 🧪 Testing

```bash
# Backend tests
cd backend
pytest
pytest --cov=apps --cov-report=html

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

### 🎨 Design System

**Color Palette**:
- Primary (Navy): `#013048` (Main), `#001f2e` (Dark), `#024563` (Light)
- Accent (Gold): `#fbb03c` (Main), `#e09a1f` (Dark), `#fcc066` (Light)

### 📱 API Documentation

Once the development server is running, access the API documentation at:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

### 🚢 Deployment

#### Backend (Railway)
```bash
# Railway will automatically detect and deploy Django
# Configure environment variables in Railway dashboard
```

#### Frontend (Vercel)
```bash
# Deploy with Vercel CLI
vercel

# Or connect GitHub repository to Vercel dashboard
```

### 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is private and confidential.

### 👤 Author

**Jose Alberto Mosquera**
- GitHub: [@jalmosquera](https://github.com/jalmosquera)

### 🙏 Acknowledgments

- Built with Django, React, and modern web technologies
- Designed for legal professionals
- Focused on security, privacy, and user experience

---

## Español

### 📋 Descripción del Proyecto

landingLawyer es una plataforma digital integral diseñada para profesionales legales que centraliza la comunicación con clientes, gestiona citas de manera fluida y entrega documentos legales de forma segura sin depender de aplicaciones de mensajería tradicionales como WhatsApp.

### ✨ Características Principales

#### 🎯 Características Actuales (Implementadas)

- ✅ **Página de Aterrizaje Profesional**
  - Sección hero con llamados a la acción
  - Showcase de áreas de práctica
  - Testimonios de clientes
  - Formulario de contacto
  - Diseño responsive con esquema de colores personalizado (Navy #013048 & Dorado #fbb03c)

- ✅ **Infraestructura Backend**
  - Django 5.2.3 + Django REST Framework 3.16
  - Base de datos PostgreSQL con migraciones completas
  - Sistema de autenticación JWT
  - Documentación API con Swagger/ReDoc (drf-spectacular)
  - Arquitectura modular de apps (users, clients, reports, tokens, appointments, landing)

- ✅ **Entorno de Desarrollo**
  - Estructura monorepo (backend/ + frontend/)
  - Arquitectura Feature-Sliced Design para frontend
  - Ruff para linting y formateo de Python
  - Configuración pytest para testing
  - Soporte Docker
  - Pipeline CI/CD con GitHub Actions

#### 🚀 Características Planificadas (Próximamente)

- 🔨 **Sistema de Gestión de Clientes**
  - Operaciones CRUD completas para registros de clientes
  - Información de contacto y notas de casos
  - Logs y historial de comunicación
  - Búsqueda avanzada y filtrado

- 🔨 **Programación de Citas**
  - Integración con Google Calendar
  - Generación automática de enlaces Google Meet
  - Notificaciones por email para citas
  - Detección de conflictos y verificación de disponibilidad
  - Sin exposición de número telefónico personal

- 🔨 **Entrega Segura de Documentos**
  - Control de acceso basado en tokens (sin login de cliente requerido)
  - Tokens de acceso únicos y con límite de tiempo
  - Integración AWS S3 para almacenamiento de PDFs
  - URLs pre-firmadas para descargas seguras
  - Seguimiento de descargas y logs de auditoría
  - Fechas de expiración configurables
  - Opciones de tokens de un solo uso o múltiples usos

- 🔨 **Panel de Administración**
  - Interfaz de gestión de clientes
  - Carga y organización de reportes
  - Vista de calendario de citas
  - Generación y gestión de tokens
  - Visor de logs de comunicación
  - Analíticas y estadísticas

- 🔨 **Notificaciones por Email**
  - Integración con Brevo (300 emails/día tier gratuito)
  - Confirmaciones de citas
  - Alertas de disponibilidad de documentos
  - Notificaciones de recordatorio

### 🚀 Comenzar

#### Prerrequisitos

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+ (opcional para desarrollo)
- Git

#### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/jalmosquera/landingLawyer.git
cd landingLawyer
```

2. **Configuración del Backend**
```bash
# Crear entorno virtual
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

# Instalar dependencias
pip install -r backend/requirements.txt

# Copiar archivo de entorno
cp backend/.env.example backend/.env

# Ejecutar migraciones
python backend/manage.py migrate

# Crear superusuario
python backend/manage.py createsuperuser

# Ejecutar servidor de desarrollo
python backend/manage.py runserver
```

3. **Configuración del Frontend**
```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Ejecutar servidor de desarrollo
npm run dev
```

### 📱 Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/docs

### 📄 Licencia

Este proyecto es privado y confidencial.

### 👤 Autor

**Jose Alberto Mosquera**
- GitHub: [@jalmosquera](https://github.com/jalmosquera)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
