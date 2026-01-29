import Usuario from '../models/Usuario.js';
import { generarToken } from '../utils/jwt.js';

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/auth/registro
 * @access  Privado (solo Admin)
 */
export const registro = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono } = req.body;

    // Validar que se proporcionaron los campos requeridos
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione nombre, email y password',
      });
    }

    // Verificar si el email ya existe
    const usuarioExiste = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email: email.toLowerCase(),
      password,
      rol: rol || 'operador',
      telefono,
    });

    // Generar token
    const token = generarToken(usuario);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          telefono: usuario.telefono,
          activo: usuario.activo,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message,
    });
  }
};

/**
 * @desc    Iniciar sesión
 * @route   POST /api/auth/login
 * @access  Público
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione email y password',
      });
    }

    // Buscar usuario por email (incluir password)
    const usuario = await Usuario.findOne({
      email: email.toLowerCase(),
    }).select('+password');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador',
      });
    }

    // Verificar password
    const passwordCorrecto = await usuario.compararPassword(password);
    if (!passwordCorrecto) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Generar token
    const token = generarToken(usuario);

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          telefono: usuario.telefono,
          activo: usuario.activo,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener perfil del usuario autenticado
 * @route   GET /api/auth/perfil
 * @access  Privado
 */
export const obtenerPerfil = async (req, res) => {
  try {
    // El usuario ya está en req.usuario gracias al middleware
    res.status(200).json({
      success: true,
      data: {
        usuario: req.usuario,
      },
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar perfil del usuario autenticado
 * @route   PUT /api/auth/perfil
 * @access  Privado
 */
export const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, password } = req.body;

    const usuario = await Usuario.findById(req.usuario._id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Actualizar campos permitidos
    if (nombre) usuario.nombre = nombre;
    if (telefono) usuario.telefono = telefono;
    if (password) usuario.password = password; // Se hasheará automáticamente

    await usuario.save();

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          telefono: usuario.telefono,
          activo: usuario.activo,
        },
      },
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message,
    });
  }
};

/**
 * @desc    Cambiar password
 * @route   PUT /api/auth/cambiar-password
 * @access  Privado
 */
export const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione password actual y nuevo',
      });
    }

    // Obtener usuario con password
    const usuario = await Usuario.findById(req.usuario._id).select('+password');

    // Verificar password actual
    const passwordCorrecto = await usuario.compararPassword(passwordActual);
    if (!passwordCorrecto) {
      return res.status(401).json({
        success: false,
        message: 'Password actual incorrecto',
      });
    }

    // Actualizar password
    usuario.password = passwordNuevo;
    await usuario.save();

    res.status(200).json({
      success: true,
      message: 'Password actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error al cambiar password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar password',
      error: error.message,
    });
  }
};

export default {
  registro,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
};
