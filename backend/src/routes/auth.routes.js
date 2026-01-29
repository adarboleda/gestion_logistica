import express from 'express';
import {
  registro,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
} from '../controllers/auth.controller.js';
import verificarAutenticacion from '../middleware/auth.middleware.js';
import { esAdmin } from '../middleware/role.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/registro
 * @desc    Registrar nuevo usuario
 * @access  Privado (Solo Admin)
 */
router.post('/registro', verificarAutenticacion, esAdmin, registro);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Público
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/perfil', verificarAutenticacion, obtenerPerfil);

/**
 * @route   PUT /api/auth/perfil
 * @desc    Actualizar perfil del usuario autenticado
 * @access  Privado
 */
router.put('/perfil', verificarAutenticacion, actualizarPerfil);

/**
 * @route   PUT /api/auth/cambiar-password
 * @desc    Cambiar password del usuario autenticado
 * @access  Privado
 */
router.put('/cambiar-password', verificarAutenticacion, cambiarPassword);

export default router;
