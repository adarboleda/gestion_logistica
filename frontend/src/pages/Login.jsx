import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { authService } from '../services';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(
        formData.email,
        formData.password,
      );

      if (response.success) {
        login(response.data.usuario, response.data.token);
        navigate('/dashboard', { replace: true });
      } else {
        setError(response.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Error en login:', err);
      if (err.response) {
        setError(err.response.data?.message || 'Credenciales incorrectas');
      } else if (err.request) {
        setError('No se pudo conectar con el servidor. Verifique su conexión.');
      } else {
        setError('Error al iniciar sesión. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email, password) => {
    setFormData({ email, password });
    setError('');
  };

  return (
    <section className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-6 py-8">
        {/* Logo */}
        <a
          href="#"
          className="flex items-center justify-center mb-6 text-2xl font-semibold text-gray-900"
        >
          <i className="pi pi-box mr-2 text-3xl text-primary-600"></i>
          Plataforma Logística
        </a>

        {/* Card */}
        <div className="w-full bg-white rounded-lg shadow border border-gray-200">
          <div className="p-6 space-y-4 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Inicia sesión en tu cuenta
            </h1>

            {/* Mensaje de error */}
            {error && (
              <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200">
                <span className="font-medium">Error!</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  Tu correo electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  placeholder="nombre@empresa.com"
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-gray-900"
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  required
                />
              </div>

              {/* Remember me y Ver credenciales */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Recuérdame
                  </label>
                </div>
                <a
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="text-sm font-medium text-primary-600 hover:underline cursor-pointer"
                >
                  Ver credenciales
                </a>
              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>

              {/* Credenciales de prueba */}
              {showCredentials && (
                <div className="p-4 text-sm text-blue-800 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="font-medium mb-3">Credenciales de prueba:</p>
                  <div className="space-y-2">
                    <div
                      onClick={() =>
                        fillCredentials('admin@logistica.com', 'admin123')
                      }
                      className="p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">👤 Admin</p>
                      <p className="text-gray-600 text-xs">
                        admin@logistica.com / admin123
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        fillCredentials('coordinador@logistica.com', 'coord123')
                      }
                      className="p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">
                        👤 Coordinador
                      </p>
                      <p className="text-gray-600 text-xs">
                        coordinador@logistica.com / coord123
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        fillCredentials('conductor1@logistica.com', 'cond123')
                      }
                      className="p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">👤 Conductor1</p>
                      <p className="text-gray-600 text-xs">
                        conductor1@logistica.com / cond123
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        fillCredentials('conductor2@logistica.com', 'cond123')
                      }
                      className="p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">👤 Conductor2</p>
                      <p className="text-gray-600 text-xs">
                        conductor2@logistica.com / cond123
                      </p>
                    </div>
                    <div
                      onClick={() =>
                        fillCredentials('operador@logistica.com', 'oper123')
                      }
                      className="p-2 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                      <p className="font-medium text-gray-900">👤 Operador</p>
                      <p className="text-gray-600 text-xs">
                        operador@logistica.com / oper123
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
