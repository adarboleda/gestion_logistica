import express from 'express';
import {
  obtenerVehiculos,
  obtenerVehiculosDisponibles,
  obtenerVehiculoPorId,
  crearVehiculo,
  actualizarVehiculo,
  cambiarEstadoVehiculo,
  eliminarVehiculo,
  obtenerHistorialVehiculo,
} from '../controllers/vehiculo.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';
import { esAdmin, esAdminOCoordinador } from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/vehiculos/disponibles
 * @desc    Obtener vehículos disponibles para asignación
 * @access  Private
 */
router.get('/disponibles', obtenerVehiculosDisponibles);

/**
 * @route   GET /api/vehiculos/:id/historial
 * @desc    Obtener historial de rutas del vehículo
 * @access  Private
 */
router.get('/:id/historial', obtenerHistorialVehiculo);

/**
 * @route   GET /api/vehiculos
 * @desc    Obtener todos los vehículos (con paginación y filtros)
 * @access  Private
 */
router.get('/', obtenerVehiculos);

/**
 * @route   GET /api/vehiculos/:id
 * @desc    Obtener vehículo por ID
 * @access  Private
 */
router.get('/:id', obtenerVehiculoPorId);

/**
 * @route   POST /api/vehiculos
 * @desc    Crear nuevo vehículo
 * @access  Private (Admin/Coordinador)
 */
router.post('/', esAdminOCoordinador, crearVehiculo);

/**
 * @route   PUT /api/vehiculos/:id
 * @desc    Actualizar vehículo existente
 * @access  Private (Admin/Coordinador)
 */
router.put('/:id', esAdminOCoordinador, actualizarVehiculo);

/**
 * @route   PATCH /api/vehiculos/:id/estado
 * @desc    Cambiar estado del vehículo
 * @access  Private (Admin/Coordinador)
 */
router.patch('/:id/estado', esAdminOCoordinador, cambiarEstadoVehiculo);

/**
 * @route   DELETE /api/vehiculos/:id
 * @desc    Eliminar vehículo
 * @access  Private (Admin)
 */
router.delete('/:id', esAdmin, eliminarVehiculo);

export default router;
