import { useState, useEffect } from 'react';
import { useAuthStore } from '../context/authStore';
import api from '../services/api';

function Dashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    productos: 0,
    movimientosHoy: 0,
    stockBajo: 0,
    bodegas: 0,
    vehiculos: 0,
    rutasActivas: 0,
    rutasCompletadas: 0,
    usuarios: 0,
  });
  const [historialEntregas, setHistorialEntregas] = useState([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // Cargar productos
      const respProductos = await api.get('/productos?limit=1');
      const totalProductos = respProductos.data?.data?.paginacion?.total || 0;

      // Cargar productos con stock bajo
      const respStockBajo = await api.get(
        '/productos?stockBajo=true&limit=100',
      );
      const stockBajo = respStockBajo.data?.data?.productos?.length || 0;

      // Cargar bodegas
      const respBodegas = await api.get('/bodegas?limit=1');
      const totalBodegas = respBodegas.data?.data?.paginacion?.total || 0;

      // Cargar vehículos
      const respVehiculos = await api.get('/vehiculos?limit=1');
      const totalVehiculos = respVehiculos.data?.data?.paginacion?.total || 0;

      // Cargar rutas
      const respRutasActivas = await api.get(
        '/rutas?estado=en_transito&limit=100',
      );
      const rutasActivas = respRutasActivas.data?.data?.rutas?.length || 0;

      const respRutasCompletadas = await api.get(
        '/rutas?estado=completada&limit=100',
      );
      const rutasCompletadas =
        respRutasCompletadas.data?.data?.rutas?.length || 0;

      // Cargar movimientos de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const respMovimientos = await api.get(
        `/movimientos?fecha_inicio=${hoy}&limit=100`,
      );
      const movimientosHoy =
        respMovimientos.data?.data?.movimientos?.length || 0;

      // Cargar historial de entregas
      try {
        const respHistorial = await api.get(
          '/rutas/historial/entregas?periodo=semana',
        );
        setHistorialEntregas(respHistorial.data?.data?.entregas || []);
      } catch (e) {
        setHistorialEntregas([]);
      }

      setStats({
        productos: totalProductos,
        movimientosHoy,
        stockBajo,
        bodegas: totalBodegas,
        vehiculos: totalVehiculos,
        rutasActivas,
        rutasCompletadas,
        usuarios: 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const estadisticas = [
    {
      label: 'Productos',
      value: stats.productos,
      icon: 'pi-box',
      color: 'bg-blue-500',
    },
    {
      label: 'Movimientos Hoy',
      value: stats.movimientosHoy,
      icon: 'pi-arrow-right-arrow-left',
      color: 'bg-green-500',
    },
    {
      label: 'Stock Bajo',
      value: stats.stockBajo,
      icon: 'pi-exclamation-triangle',
      color: 'bg-yellow-500',
    },
    {
      label: 'Bodegas',
      value: stats.bodegas,
      icon: 'pi-building',
      color: 'bg-purple-500',
    },
    {
      label: 'Vehículos',
      value: stats.vehiculos,
      icon: 'pi-car',
      color: 'bg-indigo-500',
    },
    {
      label: 'Rutas Activas',
      value: stats.rutasActivas,
      icon: 'pi-map',
      color: 'bg-orange-500',
    },
    {
      label: 'Rutas Completadas',
      value: stats.rutasCompletadas,
      icon: 'pi-check-circle',
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido, {user?.nombre}</p>
        </div>
        <button
          onClick={cargarEstadisticas}
          className="p-2 text-gray-600 rounded-lg hover:bg-gray-100"
          title="Actualizar"
        >
          <i
            className={`pi pi-refresh text-xl ${loading ? 'pi-spin' : ''}`}
          ></i>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {estadisticas.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-5 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.color} rounded-full p-3 text-white`}>
                <i className={`pi ${stat.icon} text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Historial de Entregas */}
      {historialEntregas.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📦 Entregas Recientes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700"># Ruta</th>
                  <th className="px-4 py-3 text-left text-gray-700">Destino</th>
                  <th className="px-4 py-3 text-left text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-gray-700">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {historialEntregas.slice(0, 5).map((entrega, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-medium">
                      {entrega.numeroRuta}
                    </td>
                    <td className="px-4 py-3">{entrega.destino?.nombre}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          entrega.estado === 'completada'
                            ? 'bg-green-100 text-green-800'
                            : entrega.estado === 'en_transito'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {entrega.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(entrega.fecha_programada).toLocaleDateString(
                        'es-CO',
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Módulos Implementados */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          ✅ Sistema Completamente Implementado
        </h2>
        <p className="text-gray-600 mb-6">
          Todos los módulos del sistema están operativos:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Módulo 1 */}
          <div>
            <h3 className="text-lg font-semibold text-primary-600 mb-3">
              Módulo 1: Usuarios y Autenticación
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Registro de personal
                (4 roles)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Login con JWT
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Gestión de perfil
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Control de roles y
                permisos
              </li>
            </ul>
          </div>

          {/* Módulo 2 */}
          <div>
            <h3 className="text-lg font-semibold text-primary-600 mb-3">
              Módulo 2: Inventario y Bodegas
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> CRUD de Bodegas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> CRUD de Productos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Movimientos
                (entrada/salida)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Transferencias entre
                bodegas
              </li>
            </ul>
          </div>

          {/* Módulo 3 */}
          <div>
            <h3 className="text-lg font-semibold text-primary-600 mb-3">
              Módulo 3: Rutas y Transporte
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> CRUD de Vehículos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Asignación de
                conductores
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Creación de rutas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Control de estados
              </li>
            </ul>
          </div>

          {/* Módulo 4 */}
          <div>
            <h3 className="text-lg font-semibold text-primary-600 mb-3">
              Módulo 4: Entregas y Seguimiento
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Registro de entregas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Estados de entrega
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Tracking GPS simulado
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Historial de entregas
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
