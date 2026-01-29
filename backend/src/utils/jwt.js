import jwt from 'jsonwebtoken';

/**
 * Genera un token JWT para un usuario
 * @param {Object} payload - Datos del usuario a incluir en el token
 * @returns {String} Token JWT firmado
 */
export const generarToken = (payload) => {
  const { _id, email, rol } = payload;

  return jwt.sign(
    {
      id: _id,
      email,
      rol,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    },
  );
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token es inválido o ha expirado
 */
export const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw error;
  }
};

/**
 * Extrae el token del header Authorization
 * @param {String} authHeader - Header de autorización
 * @returns {String|null} Token extraído o null
 */
export const extraerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remover 'Bearer '
};

export default {
  generarToken,
  verificarToken,
  extraerToken,
};
