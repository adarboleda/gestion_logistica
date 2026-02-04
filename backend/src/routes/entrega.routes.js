import express from 'express';
import {
  crearEntrega,
  obtenerEntregas,
  obtenerEntregaPorId,
  actualizarEstadoEntrega,
  obtenerHistorialEntregas,
  crearEntregaDesdeRuta,
  eliminarEntrega,
} from '../controllers/entrega.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';
import { esAdmin, esAdminOCoordinador } from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * RUTAS DE ENTREGAS - SIMPLIFICADAS
 *
 * Las entregas se crean automáticamente cuando una Ruta pasa a 'en_transito'.
 * El conductor usa este módulo solo para marcar el estado final de la entrega.
 *
 * IMPORTANTE: El tracking GPS está en el módulo de Rutas, no aquí.
 */

/**
 * @route   GET /api/entregas/historial
 * @desc    Obtener historial de entregas (día, semana, mes)
 * @access  Privado
 */
router.get('/historial', obtenerHistorialEntregas);

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
 * @desc    Crear nueva entrega manualmente
 * @access  Privado (Coordinador/Admin)
 */
router.post('/', esAdminOCoordinador, crearEntrega);

/**
 * @route   POST /api/entregas/desde-ruta/:rutaId
 * @desc    Crear entrega desde una ruta (cuando cambia a en_transito)
 * @access  Privado (Coordinador/Admin)
 */
router.post('/desde-ruta/:rutaId', esAdminOCoordinador, crearEntregaDesdeRuta);

/**
 * @route   PATCH /api/entregas/:id/estado
 * @desc    Marcar estado de entrega (conductor marca resultado)
 * @access  Privado
 * @body    { estado, motivoNoEntrega?, observaciones?, productosEntregados?, firma?, fotoEntrega?, calificacion? }
 */
router.patch('/:id/estado', actualizarEstadoEntrega);

/**
 * @route   DELETE /api/entregas/:id
 * @desc    Eliminar entrega
 * @access  Privado (Admin)
 */
router.delete('/:id', esAdmin, eliminarEntrega);

export default router;
