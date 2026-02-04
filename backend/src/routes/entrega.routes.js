import express from 'express';
import {
  crearEntrega,
  obtenerEntregas,
  obtenerEntregaPorId,
  actualizarEstadoEntrega,
  iniciarTrackingSimulado,
  simularActualizacionUbicacion,
  obtenerTracking,
  obtenerHistorialEntregas,
  completarEntrega,
  crearEntregaDesdeRuta,
  eliminarEntrega,
} from '../controllers/entrega.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';
import { esAdmin, esAdminOCoordinador } from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/entregas/historial
 * @desc    Obtener historial de entregas (día, semana, mes)
 * @access  Privado
 */
router.get('/historial', obtenerHistorialEntregas);

/**
 * @route   GET /api/entregas/:id/tracking
 * @desc    Obtener tracking/ubicación de una entrega
 * @access  Privado
 */
router.get('/:id/tracking', obtenerTracking);

/**
 * @route   GET /api/entregas
 * @desc    Obtener todas las entregas con filtros
 * @access  Privado
 */
router.get('/', obtenerEntregas);

/**
 * @route   GET /api/entregas/:id
 * @desc    Obtener entrega por ID
 * @access  Privado
 */
router.get('/:id', obtenerEntregaPorId);

/**
 * @route   POST /api/entregas
 * @desc    Crear nueva entrega
 * @access  Privado (Coordinador/Admin)
 */
router.post('/', esAdminOCoordinador, crearEntrega);

/**
 * @route   POST /api/entregas/desde-ruta/:rutaId
 * @desc    Crear entrega desde una ruta existente
 * @access  Privado (Coordinador/Admin)
 */
router.post('/desde-ruta/:rutaId', esAdminOCoordinador, crearEntregaDesdeRuta);

/**
 * @route   POST /api/entregas/:id/iniciar-tracking
 * @desc    Iniciar tracking simulado de la entrega
 * @access  Privado
 */
router.post('/:id/iniciar-tracking', iniciarTrackingSimulado);

/**
 * @route   POST /api/entregas/:id/simular-ubicacion
 * @desc    Simular actualización de ubicación (demo)
 * @access  Privado
 */
router.post('/:id/simular-ubicacion', simularActualizacionUbicacion);

/**
 * @route   POST /api/entregas/:id/completar
 * @desc    Completar entrega con firma y foto
 * @access  Privado
 */
router.post('/:id/completar', completarEntrega);

/**
 * @route   PATCH /api/entregas/:id/estado
 * @desc    Actualizar estado de entrega
 * @access  Privado
 */
router.patch('/:id/estado', actualizarEstadoEntrega);

/**
 * @route   DELETE /api/entregas/:id
 * @desc    Eliminar entrega
 * @access  Privado (Admin)
 */
router.delete('/:id', esAdmin, eliminarEntrega);

export default router;
