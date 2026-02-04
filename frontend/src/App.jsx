import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';

// Pages (crearemos estas páginas después)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Movimientos from './pages/Movimientos';
import Usuarios from './pages/Usuarios';
import Bodegas from './pages/Bodegas';
import Vehiculos from './pages/Vehiculos';
import Rutas from './pages/Rutas';
import Entregas from './pages/Entregas';
import NotFound from './pages/NotFound';

// Layout
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (sin layout) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Rutas protegidas (con layout) */}
        <Route
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/bodegas" element={<Bodegas />} />
          <Route path="/vehiculos" element={<Vehiculos />} />
          <Route path="/rutas" element={<Rutas />} />
          <Route path="/entregas" element={<Entregas />} />
        </Route>

        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Componente para proteger rutas
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default App;
