import express from 'express';
import {
  obtenerRutas,
  obtenerRutaPorId,
  crearRuta,
  actualizarRuta,
  cambiarEstadoRuta,
  iniciarRuta,
  registrarEntrega,
  actualizarTracking,
  obtenerTracking,
  obtenerHistorialEntregas,
  eliminarRuta,
} from '../controllers/ruta.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';
import {
  esAdmin,
  esAdminOCoordinador,
  esConductor,
} from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/rutas/historial/entregas
 * @desc    Obtener historial de entregas (RF14)
 * @access  Private
 */
router.get('/historial/entregas', obtenerHistorialEntregas);

/**
 * @route   GET /api/rutas/:id/tracking
 * @desc    Obtener tracking/ubicación de una ruta (RF13)
 * @access  Private
 */
router.get('/:id/tracking', obtenerTracking);

/**
 * @route   GET /api/rutas
 * @desc    Obtener todas las rutas (con paginación y filtros)
 * @access  Private
 */
router.get('/', obtenerRutas);

/**
 * @route   GET /api/rutas/:id
 * @desc    Obtener ruta por ID
 * @access  Private
 */
router.get('/:id', obtenerRutaPorId);

/**
 * @route   POST /api/rutas
 * @desc    Crear nueva ruta de transporte (RF09)
 * @access  Private (Coordinador/Admin)
 */
router.post('/', esAdminOCoordinador, crearRuta);

/**
 * @route   POST /api/rutas/:id/iniciar
 * @desc    Iniciar ruta - Cambiar estado a "en tránsito" (RF10)
 * @access  Private (Conductor asignado/Coordinador/Admin)
 */
router.post('/:id/iniciar', iniciarRuta);

/**
 * @route   POST /api/rutas/:id/entrega
 * @desc    Registrar entrega de productos (RF11)
 * @access  Private (Conductor/Coordinador/Admin)
 */
router.post('/:id/entrega', registrarEntrega);

/**
 * @route   POST /api/rutas/:id/tracking
 * @desc    Actualizar ubicación GPS (RF13)
 * @access  Private (Conductor/Admin)
 */
router.post('/:id/tracking', actualizarTracking);

/**
 * @route   PUT /api/rutas/:id
 * @desc    Actualizar ruta existente
 * @access  Private (Coordinador/Admin)
 */
router.put('/:id', esAdminOCoordinador, actualizarRuta);

/**
 * @route   PATCH /api/rutas/:id/estado
 * @desc    Cambiar estado de ruta (RF10, RF12)
 * @access  Private (Conductor/Coordinador/Admin)
 */
router.patch('/:id/estado', cambiarEstadoRuta);

/**
 * @route   DELETE /api/rutas/:id
 * @desc    Eliminar ruta
 * @access  Private (Admin)
 */
router.delete('/:id', esAdmin, eliminarRuta);

export default router;
