# Eduardo Bernal Abogado Platform

> Full-stack legal platform for client acquisition, appointment management, secure document delivery, and client portal access.

[![Django](https://img.shields.io/badge/Django-5.2.3-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.16.0-red.svg)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.5-38bdf8.svg)](https://tailwindcss.com/)

**Live site:** https://eduardobernalabogado.es

[English](#english) | [Español](#español)

---

## English

## Overview

This project is not just a marketing website.

It is a full-stack legal platform built for a law firm to centralize public client acquisition, internal case-related operations, appointment scheduling, and secure document delivery without relying on informal channels such as WhatsApp for sensitive files.

The public website is only one part of the system. Behind it, the platform includes authenticated staff workflows, client portal access, appointment availability logic, secure document access flows, and audit-ready delivery mechanisms.

## Core Value

The platform solves four practical problems for a legal practice:

- Present the firm professionally online and capture qualified leads
- Organize clients and case-related workflows from a private admin environment
- Let potential clients request appointments without exposing the lawyer’s personal phone number
- Deliver sensitive documents through controlled, expiring access flows instead of sending files directly over chat apps

## Main Capabilities

### 1. Public legal website
- Professional firm presentation
- Practice areas and trust-building content
- Contact and lead capture flows
- Responsive interface adapted for mobile and desktop

### 2. Client management
- Internal client CRUD
- Client search and filtering
- Portal-access-aware workflows
- Client profile access from a protected portal

### 3. Appointment system
- Internal appointment management
- Public appointment request flow without authentication
- Public availability checking by date and duration
- Lawyer availability configuration
- Appointment confirmation and cancellation flows
- Google Calendar synchronization
- Google Meet link generation
- WhatsApp notification link generation when needed

### 4. Secure document delivery
- Document upload and management
- Client notification flow for new documents
- Access-code validation flow
- Expiring download tokens
- One-time-use access logic
- Download audit trail with access logs
- Controlled delivery of sensitive documents
- Client-side document portal access

### 5. Client portal
- Authenticated access to personal profile
- Access to own appointments
- Access to own documents
- Ability to upload documents to owned cases

## Why this project matters

Legal workflows are not just about showing a nice website.

A serious legal platform needs:
- structured client data
- access control
- appointment coordination
- secure document exchange
- traceability

This project was designed around those operational needs, not only around visual presentation.

## Architecture

This repository follows a monorepo structure with clearly separated frontend and backend responsibilities.

### Backend
- Django + Django REST Framework
- Modular app-based architecture
- JWT authentication
- PostgreSQL-ready
- OpenAPI documentation with Swagger/ReDoc
- S3-ready document storage support
- Role-based access control

### Frontend
- React + Vite
- TailwindCSS
- Zustand
- React Router
- Form handling and validation with React Hook Form + Zod

## Domain Modules

### Backend apps
- `users` — authentication and user roles
- `clients` — client records and portal linkage
- `cases` — legal case structure
- `documents` — secure document workflows
- `appointments` — scheduling, availability, calendar sync
- `landing` — public-facing website and contact flows

## Security-Oriented Design

This project includes security decisions aligned with legal-service needs:

- JWT-based authenticated access
- Protected staff-only endpoints
- Separate client portal permissions
- Expiring document access flows
- Single-use download tokens
- Access attempt tracking
- Download logs and audit trail
- Configurable expiration windows
- Support for secure external file storage

The goal is simple: reduce friction for the client while keeping sensitive material under control.

## Tech Stack

### Backend
- Django
- Django REST Framework
- PostgreSQL
- SimpleJWT
- drf-spectacular
- django-storages
- Gunicorn
- Whitenoise
- pytest
- Ruff

### Frontend
- React
- Vite
- TailwindCSS
- Zustand
- React Router DOM
- React Hook Form
- Zod
- Axios
- Heroicons / React Icons

### External integrations
- Google Calendar API
- Google Meet
- AWS S3
- Email provider integration
- Railway
- Vercel

## Project Structure

```bash
landingLawyer/
├── backend/
│   ├── apps/
│   │   ├── users/
│   │   ├── clients/
│   │   ├── cases/
│   │   ├── documents/
│   │   ├── appointments/
│   │   └── landing/
│   ├── core/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── .github/
├── docs/
├── docker-compose.yml
└── README.md
```

## API and Documentation

When running locally, documentation is available at:

- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- OpenAPI Schema: `/api/schema/`

## Deployment

- **Frontend:** Vercel
- **Backend:** Railway
- **Production domain:** https://eduardobernalabogado.es

## Author

**Jose Alberto Mosquera**  
GitHub: [@jalmosquera](https://github.com/jalmosquera)

---

## Español

## Descripción general

Este proyecto no es solo una web corporativa.

Es una **plataforma legal full-stack** creada para un despacho de abogados, pensada para centralizar la captación pública de clientes, la operativa interna del despacho, la gestión de citas y la entrega segura de documentos sin depender de canales informales como WhatsApp para archivos sensibles.

La web pública es solo una parte del sistema. Detrás de ella hay flujos autenticados para personal del despacho, acceso para clientes, lógica de disponibilidad para citas y mecanismos de entrega documental con control de acceso y trazabilidad.

## Qué resuelve

La plataforma ataca cuatro problemas reales del trabajo jurídico:

- Mostrar el despacho de forma profesional y captar clientes potenciales
- Organizar clientes y flujos internos desde un entorno privado
- Permitir solicitudes de cita sin exponer el teléfono personal del abogado
- Entregar documentación sensible mediante accesos controlados y temporales en lugar de enviar archivos directamente por apps de mensajería

## Capacidades principales

### 1. Web pública del despacho
- Presentación profesional del abogado
- Áreas de práctica y contenido de confianza
- Formularios de contacto y captación
- Interfaz responsive para móvil y escritorio

### 2. Gestión de clientes
- CRUD interno de clientes
- Búsqueda y filtrado
- Gestión según acceso al portal
- Perfil del cliente accesible desde portal protegido

### 3. Sistema de citas
- Gestión interna de citas
- Solicitud pública de citas sin login
- Consulta pública de disponibilidad por fecha y duración
- Configuración de disponibilidad del abogado
- Confirmación y cancelación de citas
- Sincronización con Google Calendar
- Generación de enlace de Google Meet
- Generación de enlace de WhatsApp cuando hace falta

### 4. Entrega segura de documentos
- Subida y gestión de documentos
- Notificación al cliente cuando hay documentación disponible
- Validación mediante código de acceso
- Tokens temporales de descarga
- Descargas de un solo uso
- Registro de accesos y trazabilidad
- Entrega controlada de documentos sensibles
- Acceso a documentos desde el portal del cliente

### 5. Portal del cliente
- Acceso autenticado a su perfil
- Consulta de sus citas
- Consulta de sus documentos
- Subida de documentos a sus propios casos

## Por qué este proyecto tiene más peso que una “landing”

Un despacho serio no necesita solo una página bonita.

Necesita:
- datos estructurados de clientes
- control de acceso
- coordinación de citas
- intercambio seguro de documentación
- trazabilidad de accesos

Este proyecto fue planteado alrededor de esas necesidades operativas, no solo alrededor del diseño visual.

## Arquitectura

El repositorio usa una estructura monorepo con separación clara entre frontend y backend.

### Backend
- Django + Django REST Framework
- Arquitectura modular por apps
- Autenticación JWT
- Base de datos PostgreSQL
- Documentación OpenAPI con Swagger/ReDoc
- Soporte para almacenamiento documental en S3
- Control de acceso por roles

### Frontend
- React + Vite
- TailwindCSS
- Zustand
- React Router
- Formularios con React Hook Form + Zod

## Módulos de dominio

### Apps del backend
- `users` — autenticación y roles
- `clients` — clientes y acceso al portal
- `cases` — estructura de casos jurídicos
- `documents` — flujos de entrega documental segura
- `appointments` — citas, disponibilidad y sincronización con calendario
- `landing` — parte pública del sitio

## Enfoque de seguridad

La plataforma incorpora decisiones técnicas pensadas para un entorno jurídico:

- acceso autenticado con JWT
- endpoints protegidos para personal del despacho
- permisos diferenciados para clientes
- accesos documentales con expiración
- tokens de descarga de un solo uso
- trazabilidad de intentos de acceso
- logs de descarga y auditoría
- ventanas de expiración configurables
- soporte para almacenamiento externo seguro

La idea es sencilla: facilitarle el acceso al cliente sin perder control sobre documentación sensible.

## Stack tecnológico

### Backend
- Django
- Django REST Framework
- PostgreSQL
- SimpleJWT
- drf-spectacular
- django-storages
- Gunicorn
- Whitenoise
- pytest
- Ruff

### Frontend
- React
- Vite
- TailwindCSS
- Zustand
- React Router DOM
- React Hook Form
- Zod
- Axios
- Heroicons / React Icons

### Integraciones externas
- Google Calendar API
- Google Meet
- AWS S3
- integración con email
- Railway
- Vercel

## Estructura del proyecto

```bash
landingLawyer/
├── backend/
│   ├── apps/
│   │   ├── users/
│   │   ├── clients/
│   │   ├── cases/
│   │   ├── documents/
│   │   ├── appointments/
│   │   └── landing/
│   ├── core/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── .github/
├── docs/
├── docker-compose.yml
└── README.md
```

## API y documentación

En local, la documentación queda disponible en:

- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- OpenAPI Schema: `/api/schema/`

## Despliegue

- **Frontend:** Vercel
- **Backend:** Railway
- **Dominio de producción:** https://eduardobernalabogado.es

## Autor

**Jalberth Mosquera**  
GitHub: [@jalmosquera](https://github.com/jalmosquera)
