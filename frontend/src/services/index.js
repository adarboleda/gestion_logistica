import api from './api';

// ==================== AUTH ====================

export const authService = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Registro
  registro: async (userData) => {
    const response = await api.post('/auth/registro', userData);
    return response.data;
  },

  // Obtener perfil
  obtenerPerfil: async () => {
    const response = await api.get('/auth/perfil');
    return response.data;
  },

  // Actualizar perfil
  actualizarPerfil: async (userData) => {
    const response = await api.put('/auth/perfil', userData);
    return response.data;
  },

  // Cambiar password
  cambiarPassword: async (passwordAntiguo, passwordNuevo) => {
    const response = await api.put('/auth/cambiar-password', {
      passwordAntiguo,
      passwordNuevo,
    });
    return response.data;
  },
};

// ==================== PRODUCTOS ====================

export const productoService = {
  // Obtener todos
  obtenerTodos: async (params = {}) => {
    const response = await api.get('/productos', { params });
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  },

  // Crear
  crear: async (productoData) => {
    const response = await api.post('/productos', productoData);
    return response.data;
  },

  // Actualizar
  actualizar: async (id, productoData) => {
    const response = await api.put(`/productos/${id}`, productoData);
    return response.data;
  },

  // Eliminar
  eliminar: async (id) => {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },

  // Stock bajo
  obtenerStockBajo: async (params = {}) => {
    const response = await api.get('/productos/alertas/stock-bajo', { params });
    return response.data;
  },

  // Por bodega
  obtenerPorBodega: async (bodegaId) => {
    const response = await api.get(`/productos/bodega/${bodegaId}`);
    return response.data;
  },

  // Resumen
  obtenerResumen: async (params = {}) => {
    const response = await api.get('/productos/reportes/resumen', { params });
    return response.data;
  },

  // Cambiar estado
  cambiarEstado: async (id, activo) => {
    const response = await api.patch(`/productos/${id}/estado`, { activo });
    return response.data;
  },
};

// ==================== MOVIMIENTOS ====================

export const movimientoService = {
  // Obtener todos
  obtenerTodos: async (params = {}) => {
    const response = await api.get('/movimientos', { params });
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/movimientos/${id}`);
    return response.data;
  },

  // Crear
  crear: async (movimientoData) => {
    const response = await api.post('/movimientos', movimientoData);
    return response.data;
  },

  // Historial de producto
  obtenerHistorialProducto: async (productoId, params = {}) => {
    const response = await api.get(`/movimientos/producto/${productoId}`, {
      params,
    });
    return response.data;
  },

  // Resumen
  obtenerResumen: async (params = {}) => {
    const response = await api.get('/movimientos/reportes/resumen', { params });
    return response.data;
  },

  // Recientes
  obtenerRecientes: async (limit = 10) => {
    const response = await api.get('/movimientos/recientes', {
      params: { limit },
    });
    return response.data;
  },

  // Por usuario
  obtenerPorUsuario: async (usuarioId, params = {}) => {
    const response = await api.get(`/movimientos/usuario/${usuarioId}`, {
      params,
    });
    return response.data;
  },
};

// ==================== USUARIOS ====================

export const usuarioService = {
  // Obtener todos
  obtenerTodos: async (params = {}) => {
    const response = await api.get('/usuarios', { params });
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  // Crear
  crear: async (usuarioData) => {
    const response = await api.post('/usuarios', usuarioData);
    return response.data;
  },

  // Actualizar
  actualizar: async (id, usuarioData) => {
    const response = await api.put(`/usuarios/${id}`, usuarioData);
    return response.data;
  },

  // Eliminar
  eliminar: async (id) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  // Por rol
  obtenerPorRol: async (rol) => {
    const response = await api.get(`/usuarios/rol/${rol}`);
    return response.data;
  },

  // Conductores disponibles
  obtenerConductoresDisponibles: async () => {
    const response = await api.get('/usuarios/conductores/disponibles');
    return response.data;
  },

  // Cambiar estado
  cambiarEstado: async (id, activo) => {
    const response = await api.patch(`/usuarios/${id}/estado`, { activo });
    return response.data;
  },
};

// ==================== VEHÍCULOS ====================

export const vehiculoService = {
  // Obtener todos
  obtenerTodos: async (params = {}) => {
    const response = await api.get('/vehiculos', { params });
    return response.data;
  },

  // Obtener disponibles
  obtenerDisponibles: async () => {
    const response = await api.get('/vehiculos/disponibles');
    return response.data;
  },

  // Obtener historial
  obtenerHistorial: async (id) => {
    const response = await api.get(`/vehiculos/${id}/historial`);
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/vehiculos/${id}`);
    return response.data;
  },

  // Crear
  crear: async (vehiculoData) => {
    const response = await api.post('/vehiculos', vehiculoData);
    return response.data;
  },

  // Actualizar
  actualizar: async (id, vehiculoData) => {
    const response = await api.put(`/vehiculos/${id}`, vehiculoData);
    return response.data;
  },

  // Eliminar
  eliminar: async (id) => {
    const response = await api.delete(`/vehiculos/${id}`);
    return response.data;
  },

  // Cambiar estado
  cambiarEstado: async (id, estado) => {
    const response = await api.patch(`/vehiculos/${id}/estado`, { estado });
    return response.data;
  },
};

// ==================== RUTAS ====================

export const rutaService = {
  // Obtener todas
  obtenerTodas: async (params = {}) => {
    const response = await api.get('/rutas', { params });
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/rutas/${id}`);
    return response.data;
  },

  // Crear
  crear: async (rutaData) => {
    const response = await api.post('/rutas', rutaData);
    return response.data;
  },

  // Actualizar
  actualizar: async (id, rutaData) => {
    const response = await api.put(`/rutas/${id}`, rutaData);
    return response.data;
  },

  // Eliminar
  eliminar: async (id) => {
    const response = await api.delete(`/rutas/${id}`);
    return response.data;
  },

  // Iniciar ruta
  iniciarRuta: async (id) => {
    const response = await api.post(`/rutas/${id}/iniciar`);
    return response.data;
  },

  // Registrar entrega
  registrarEntrega: async (id, entregaData) => {
    const response = await api.post(`/rutas/${id}/entrega`, entregaData);
    return response.data;
  },

  // Obtener historial de entregas
  obtenerHistorialEntregas: async (params = {}) => {
    const response = await api.get('/rutas/historial/entregas', { params });
    return response.data;
  },

  // Obtener tracking
  obtenerTracking: async (id) => {
    const response = await api.get(`/rutas/${id}/tracking`);
    return response.data;
  },

  // Agregar tracking
  agregarTracking: async (id, trackingData) => {
    const response = await api.post(`/rutas/${id}/tracking`, trackingData);
    return response.data;
  },

  // Cambiar estado
  cambiarEstado: async (id, estado) => {
    const response = await api.patch(`/rutas/${id}/estado`, { estado });
    return response.data;
  },
};

// ==================== ENTREGAS ====================
/**
 * Servicio de Entregas - Simplificado
 * El tracking GPS ahora está en el servicio de rutas.
 * Este servicio es solo para marcar el estado final de las entregas.
 */

export const entregaService = {
  // Obtener todas
  obtenerTodas: async (params = {}) => {
    const response = await api.get('/entregas', { params });
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/entregas/${id}`);
    return response.data;
  },

  // Crear
  crear: async (entregaData) => {
    const response = await api.post('/entregas', entregaData);
    return response.data;
  },

  // Crear desde ruta
  crearDesdeRuta: async (rutaId) => {
    const response = await api.post(`/entregas/desde-ruta/${rutaId}`);
    return response.data;
  },

  // Actualizar estado (marcar entrega como entregado, parcial, rechazado, etc.)
  actualizarEstado: async (id, data) => {
    const response = await api.patch(`/entregas/${id}/estado`, data);
    return response.data;
  },

  // Obtener historial
  obtenerHistorial: async (params = {}) => {
    const response = await api.get('/entregas/historial', { params });
    return response.data;
  },

  // Eliminar
  eliminar: async (id) => {
    const response = await api.delete(`/entregas/${id}`);
    return response.data;
  },
};

// ==================== BODEGAS ====================

export const bodegaService = {
  // Obtener todas
  obtenerTodas: async (params = {}) => {
    const response = await api.get('/bodegas', { params });
    return response.data;
  },

  // Obtener por ID
  obtenerPorId: async (id) => {
    const response = await api.get(`/bodegas/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (id) => {
    const response = await api.get(`/bodegas/${id}/estadisticas`);
    return response.data;
  },

  // Crear
  crear: async (bodegaData) => {
    const response = await api.post('/bodegas', bodegaData);
    return response.data;
  },

  // Actualizar
  actualizar: async (id, bodegaData) => {
    const response = await api.put(`/bodegas/${id}`, bodegaData);
    return response.data;
  },

  // Eliminar
  eliminar: async (id) => {
    const response = await api.delete(`/bodegas/${id}`);
    return response.data;
  },

  // Cambiar estado
  cambiarEstado: async (id, estado) => {
    const response = await api.patch(`/bodegas/${id}/estado`, { estado });
    return response.data;
  },
};
