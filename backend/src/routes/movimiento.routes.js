import express from 'express';
import {
  crearMovimiento,
  obtenerMovimientos,
  obtenerMovimientoPorId,
  obtenerHistorialProducto,
  obtenerResumenMovimientos,
  obtenerMovimientosRecientes,
  obtenerMovimientosPorUsuario,
} from '../controllers/movimiento.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';
import {
  esAdminOCoordinador,
  esAdminOOperador,
} from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/movimientos
 * @desc    Obtener todos los movimientos con filtros y paginación
 * @access  Privado (todos los roles autenticados)
 * @query   tipo, producto, usuario, fechaInicio, fechaFin, page, limit
 */
router.get('/', obtenerMovimientos);

/**
 * @route   GET /api/movimientos/recientes
 * @desc    Obtener movimientos más recientes
 * @access  Privado (todos los roles autenticados)
 * @query   limit
 */
router.get('/recientes', obtenerMovimientosRecientes);

/**
 * @route   GET /api/movimientos/reportes/resumen
 * @desc    Obtener resumen de movimientos agrupados por tipo
 * @access  Privado (Admin, Coordinador)
 * @query   fechaInicio, fechaFin
 */
router.get('/reportes/resumen', esAdminOCoordinador, obtenerResumenMovimientos);

/**
 * @route   GET /api/movimientos/producto/:productoId
 * @desc    Obtener historial de movimientos de un producto
 * @access  Privado (todos los roles autenticados)
 * @param   productoId
 * @query   fechaInicio, fechaFin, limit
 */
router.get('/producto/:productoId', obtenerHistorialProducto);

/**
 * @route   GET /api/movimientos/usuario/:usuarioId
 * @desc    Obtener movimientos realizados por un usuario
 * @access  Privado (Admin, Coordinador)
 * @param   usuarioId
 * @query   fechaInicio, fechaFin, page, limit
 */
router.get(
  '/usuario/:usuarioId',
  esAdminOCoordinador,
  obtenerMovimientosPorUsuario,
);

/**
 * @route   GET /api/movimientos/:id
 * @desc    Obtener un movimiento por ID
 * @access  Privado (todos los roles autenticados)
 * @param   id
 */
router.get('/:id', obtenerMovimientoPorId);

/**
 * @route   POST /api/movimientos
 * @desc    Crear un nuevo movimiento (entrada, salida, transferencia)
 * @access  Privado (Admin, Operador)
 * @body    tipo, producto, cantidad, bodegaOrigen, bodegaDestino, motivoMovimiento, observaciones, documentoReferencia
 * @note    El stock del producto se actualiza automáticamente
 */
router.post('/', esAdminOOperador, crearMovimiento);

export default router;
