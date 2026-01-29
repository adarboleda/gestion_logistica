import { verificarToken, extraerToken } from '../utils/jwt.js';
import Usuario from '../models/Usuario.js';

/**
 * Middleware para verificar autenticación mediante JWT
 * Verifica el token y adjunta el usuario al objeto request
 */
export const verificarAutenticacion = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    const token = extraerToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación',
      });
    }

    // Verificar y decodificar token
    const decoded = verificarToken(token);

    // Buscar usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador',
      });
    }

    // Adjuntar usuario al request
    req.usuario = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido o expirado',
    });
  }
};

export default verificarAutenticacion;
