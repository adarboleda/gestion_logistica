import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path) => location.pathname === path;

  const menuSections = [
    {
      label: 'Principal',
      items: [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          path: '/dashboard',
        },
      ],
    },
    {
      label: 'Inventario',
      items: [
        {
          label: 'Productos',
          icon: 'pi pi-box',
          path: '/productos',
        },
        {
          label: 'Movimientos',
          icon: 'pi pi-arrow-right-arrow-left',
          path: '/movimientos',
        },
      ],
    },
    {
      label: 'Gestión',
      items: [
        {
          label: 'Bodegas',
          icon: 'pi pi-building',
          path: '/bodegas',
        },
        {
          label: 'Vehículos',
          icon: 'pi pi-car',
          path: '/vehiculos',
        },
        {
          label: 'Rutas',
          icon: 'pi pi-map',
          path: '/rutas',
        },
      ],
    },
    {
      label: 'Administración',
      visible: user?.rol === 'admin' || user?.rol === 'coordinador',
      items: [
        {
          label: 'Usuarios',
          icon: 'pi pi-users',
          path: '/usuarios',
          visible: user?.rol === 'admin',
        },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200">
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          {menuSections.map(
            (section, sectionIdx) =>
              section.visible !== false && (
                <li key={sectionIdx}>
                  {/* Section Label */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {section.label}
                  </div>
                  {/* Section Items */}
                  <ul className="space-y-1">
                    {section.items
                      .filter((item) => item.visible !== false)
                      .map((item, itemIdx) => (
                        <li key={itemIdx}>
                          <button
                            onClick={() => navigate(item.path)}
                            className={`flex items-center w-full p-2 rounded-lg transition-colors ${
                              isActive(item.path)
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <i className={`${item.icon} text-lg w-6`}></i>
                            <span className="ml-3">{item.label}</span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </li>
              ),
          )}
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
