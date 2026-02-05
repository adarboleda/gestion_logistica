import { useState } from 'react';
import { useAuthStore } from '../context/authStore';
import { useNavigate } from 'react-router-dom';

function Navbar({ onToggleSidebar, onOpenProfile }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <i className="pi pi-bars text-xl"></i>
            </button>
            <div className="flex items-center gap-2">
              <i className="pi pi-box text-2xl text-primary-600"></i>
              <span className="text-xl font-bold text-gray-900">
                Plataforma Logística
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* User Info with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-100 focus:outline-none"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white font-semibold">
                  {user?.nombre?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.nombre}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.rol}
                  </p>
                </div>
                <i className="pi pi-chevron-down text-gray-500 text-sm hidden md:block"></i>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfile && onOpenProfile();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <i className="pi pi-user"></i>
                    Mi Perfil
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <i className="pi pi-sign-out"></i>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
