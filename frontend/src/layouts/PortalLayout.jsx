/**
 * Portal Layout
 *
 * Layout for the client portal with simplified navigation.
 * Features dark mode design.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import useAuthStore from '../stores/authStore'

function PortalLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Inicio', href: '/portal/dashboard', icon: HomeIcon },
    { name: 'Mis Casos', href: '/portal/cases', icon: BriefcaseIcon },
    { name: 'Documentos', href: '/portal/documents', icon: DocumentTextIcon },
    { name: 'Mis Citas', href: '/portal/appointments', icon: CalendarIcon },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900">
          <div className="flex-1 flex justify-center">
            <div className="flex flex-col items-center">
              <Link to="/">
                <img
                  src="/logo.png"
                  alt="LandingLawyer"
                  className="h-10 w-auto object-contain mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <span className="text-xs text-blue-400 font-medium">Portal Cliente</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white absolute right-4"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-8 px-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${active
                  ? 'bg-accent text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gray-800 overflow-y-auto">
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <div className="flex flex-col items-center">
              <Link to="/">
                <img
                  src="/logo.png"
                  alt="LandingLawyer"
                  className="h-10 w-auto object-contain mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <span className="text-xs text-blue-400 font-medium">Portal Cliente</span>
            </div>
          </div>
          <nav className="flex-1 mt-8 px-4">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${active
                    ? 'bg-accent text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          {/* User info */}
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <div className="flex items-center w-full">
              <div>
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">Cliente</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 text-gray-400 hover:text-white"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header (mobile) */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow lg:hidden">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="flex flex-col items-center">
              <Link to="/">
                <img
                  src="/logo.png"
                  alt="LandingLawyer"
                  className="h-9 w-auto object-contain mb-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Portal Cliente</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              title="Cerrar sesión"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default PortalLayout
