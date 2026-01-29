import express from 'express';
import {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerUsuariosPorRol,
  obtenerConductoresDisponibles,
  cambiarEstadoUsuario,
} from '../controllers/usuario.controller.js';
import verificarAutenticacion from '../middleware/auth.middleware.js';
import {
  esAdmin,
  esAdminOCoordinador,
  puedeModificarPerfil,
} from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/usuarios/conductores/disponibles
 * @desc    Obtener conductores disponibles
 * @access  Privado (Admin/Coordinador)
 * @note    Debe ir ANTES de /:id para evitar conflictos de rutas
 */
router.get(
  '/conductores/disponibles',
  esAdminOCoordinador,
  obtenerConductoresDisponibles,
);

/**
 * @route   GET /api/usuarios/rol/:rol
 * @desc    Obtener usuarios por rol específico
 * @access  Privado (Admin/Coordinador)
 */
router.get('/rol/:rol', esAdminOCoordinador, obtenerUsuariosPorRol);

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (con paginación y filtros)
 * @access  Privado (Admin/Coordinador)
 */
router.get('/', esAdminOCoordinador, obtenerUsuarios);

/**
 * @route   POST /api/usuarios
 * @desc    Crear nuevo usuario
 * @access  Privado (Solo Admin)
 */
router.post('/', esAdmin, crearUsuario);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Privado
 */
router.get('/:id', obtenerUsuarioPorId);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar usuario
 * @access  Privado (Admin o propio usuario)
 */
router.put('/:id', puedeModificarPerfil, actualizarUsuario);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar usuario (soft delete)
 * @access  Privado (Solo Admin)
 */
router.delete('/:id', esAdmin, eliminarUsuario);

/**
 * @route   PATCH /api/usuarios/:id/estado
 * @desc    Activar/Desactivar usuario
 * @access  Privado (Solo Admin)
 */
router.patch('/:id/estado', esAdmin, cambiarEstadoUsuario);

export default router;
