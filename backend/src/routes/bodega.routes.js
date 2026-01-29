import express from 'express';
import {
  obtenerBodegas,
  obtenerBodegaPorId,
  crearBodega,
  actualizarBodega,
  cambiarEstadoBodega,
  eliminarBodega,
  obtenerEstadisticasBodega,
} from '../controllers/bodega.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';
import { esAdmin, esAdminOCoordinador } from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/bodegas
 * @desc    Obtener todas las bodegas (con paginación y filtros)
 * @access  Private
 */
router.get('/', obtenerBodegas);

/**
 * @route   GET /api/bodegas/:id/estadisticas
 * @desc    Obtener estadísticas de una bodega específica
 * @access  Private
 */
router.get('/:id/estadisticas', obtenerEstadisticasBodega);

/**
 * @route   GET /api/bodegas/:id
 * @desc    Obtener bodega por ID
 * @access  Private
 */
router.get('/:id', obtenerBodegaPorId);

/**
 * @route   POST /api/bodegas
 * @desc    Crear nueva bodega
 * @access  Private (Admin/Coordinador)
 */
router.post('/', esAdminOCoordinador, crearBodega);

/**
 * @route   PUT /api/bodegas/:id
 * @desc    Actualizar bodega existente
 * @access  Private (Admin/Coordinador)
 */
router.put('/:id', esAdminOCoordinador, actualizarBodega);

/**
 * @route   PATCH /api/bodegas/:id/estado
 * @desc    Cambiar estado de bodega (activar/desactivar)
 * @access  Private (Admin)
 */
router.patch('/:id/estado', esAdmin, cambiarEstadoBodega);

/**
 * @route   DELETE /api/bodegas/:id
 * @desc    Eliminar bodega
 * @access  Private (Admin)
 */
router.delete('/:id', esAdmin, eliminarBodega);

export default router;
