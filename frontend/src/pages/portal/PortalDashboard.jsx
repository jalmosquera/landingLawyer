/**
 * Portal Dashboard (Client)
 *
 * Main dashboard page for clients.
 */

import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

function PortalDashboard() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Portal del Cliente
          </h1>

          <div className="mb-6">
            <p className="text-gray-600">Bienvenido, <span className="font-semibold">{user?.name}</span></p>
            <p className="text-sm text-gray-500">Email: {user?.email}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              ✓ Autenticación exitosa
            </h2>
            <p className="text-green-700">
              Has iniciado sesión correctamente en el portal de clientes.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              <strong>Estado del desarrollo:</strong> El portal del cliente está en construcción.
              Las siguientes funcionalidades estarán disponibles próximamente:
            </p>

            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Ver tus casos activos</li>
              <li>Descargar documentos</li>
              <li>Subir documentos requeridos</li>
              <li>Ver tus citas programadas</li>
              <li>Solicitar nuevas citas</li>
            </ul>

            <div className="pt-6 flex space-x-4">
              <Link
                to="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir al inicio
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortalDashboard;
