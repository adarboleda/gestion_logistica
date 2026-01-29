/**
 * Middleware para verificar que el usuario tiene uno de los roles permitidos
 * Debe usarse después del middleware de autenticación
 * @param  {...String} rolesPermitidos - Roles que tienen acceso
 */
export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar que el usuario está autenticado
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'Debe estar autenticado para acceder a este recurso',
      });
    }

    // Verificar que el usuario tiene un rol permitido
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`,
        rolRequerido: rolesPermitidos,
        rolActual: req.usuario.rol,
      });
    }

    next();
  };
};

/**
 * Middleware específico para verificar que el usuario es administrador
 */
export const esAdmin = verificarRol('admin');

/**
 * Middleware para verificar que el usuario es admin o coordinador
 */
export const esAdminOCoordinador = verificarRol('admin', 'coordinador');

/**
 * Middleware para verificar que el usuario es admin u operador
 */
export const esAdminOOperador = verificarRol('admin', 'operador');

/**
 * Middleware para verificar que el usuario es conductor
 */
export const esConductor = verificarRol('conductor');

/**
 * Middleware para verificar que el usuario es operador
 */
export const esOperador = verificarRol('operador');

/**
 * Middleware para verificar que el usuario puede modificar su propio perfil
 * o es un administrador que puede modificar cualquier perfil
 */
export const puedeModificarPerfil = (req, res, next) => {
  const usuarioId = req.params.id;
  const usuarioAutenticado = req.usuario;

  // Permitir si es admin o si está modificando su propio perfil
  if (
    usuarioAutenticado.rol === 'admin' ||
    usuarioAutenticado._id.toString() === usuarioId
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'No tiene permisos para modificar este perfil',
  });
};

export default {
  verificarRol,
  esAdmin,
  esAdminOCoordinador,
  esAdminOOperador,
  esConductor,
  esOperador,
  puedeModificarPerfil,
};
