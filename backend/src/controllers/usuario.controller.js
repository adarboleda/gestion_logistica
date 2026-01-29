import Usuario from '../models/Usuario.js';

/**
 * @desc    Obtener todos los usuarios
 * @route   GET /api/usuarios
 * @access  Privado (Admin/Coordinador)
 */
export const obtenerUsuarios = async (req, res) => {
  try {
    const { rol, activo, page = 1, limit = 10 } = req.query;

    // Construir filtro
    const filtro = {};
    if (rol) filtro.rol = rol;
    if (activo !== undefined) filtro.activo = activo === 'true';

    // Paginación
    const skip = (page - 1) * limit;

    // Obtener usuarios
    const usuarios = await Usuario.find(filtro)
      .select('-password')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    // Contar total de documentos
    const total = await Usuario.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: {
        usuarios,
        paginacion: {
          total,
          pagina: parseInt(page),
          limite: parseInt(limit),
          totalPaginas: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener usuario por ID
 * @route   GET /api/usuarios/:id
 * @access  Privado
 */
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: { usuario },
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message,
    });
  }
};

/**
 * @desc    Crear nuevo usuario
 * @route   POST /api/usuarios
 * @access  Privado (Admin)
 */
export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono } = req.body;

    // Validar campos requeridos
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

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { usuario },
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar usuario
 * @route   PUT /api/usuarios/:id
 * @access  Privado (Admin o propio usuario)
 */
export const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, telefono, rol, activo } = req.body;

    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Si no es admin, no puede cambiar rol ni estado activo
    if (req.usuario.rol !== 'admin') {
      delete req.body.rol;
      delete req.body.activo;
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email.toLowerCase();
    if (telefono) usuario.telefono = telefono;
    if (rol && req.usuario.rol === 'admin') usuario.rol = rol;
    if (activo !== undefined && req.usuario.rol === 'admin')
      usuario.activo = activo;

    await usuario.save();

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { usuario },
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message,
    });
  }
};

/**
 * @desc    Eliminar usuario (soft delete)
 * @route   DELETE /api/usuarios/:id
 * @access  Privado (Admin)
 */
export const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Prevenir auto-eliminación
    if (usuario._id.toString() === req.usuario._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'No puede eliminarse a sí mismo',
      });
    }

    // Soft delete: marcar como inactivo
    usuario.activo = false;
    await usuario.save();

    res.status(200).json({
      success: true,
      message: 'Usuario desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener usuarios por rol
 * @route   GET /api/usuarios/rol/:rol
 * @access  Privado
 */
export const obtenerUsuariosPorRol = async (req, res) => {
  try {
    const { rol } = req.params;

    // Validar que el rol es válido
    const rolesValidos = ['admin', 'coordinador', 'conductor', 'operador'];
    if (!rolesValidos.includes(rol)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Roles válidos: ${rolesValidos.join(', ')}`,
      });
    }

    const usuarios = await Usuario.find({ rol, activo: true })
      .select('-password')
      .sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      data: {
        usuarios,
        total: usuarios.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener usuarios por rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener conductores disponibles
 * @route   GET /api/usuarios/conductores/disponibles
 * @access  Privado (Admin/Coordinador)
 */
export const obtenerConductoresDisponibles = async (req, res) => {
  try {
    const conductores = await Usuario.find({
      rol: 'conductor',
      activo: true,
    })
      .select('nombre email telefono')
      .sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      data: {
        conductores,
        total: conductores.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener conductores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conductores',
      error: error.message,
    });
  }
};

/**
 * @desc    Activar/Desactivar usuario
 * @route   PATCH /api/usuarios/:id/estado
 * @access  Privado (Admin)
 */
export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el estado (activo: true/false)',
      });
    }

    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Prevenir auto-desactivación
    if (usuario._id.toString() === req.usuario._id.toString() && !activo) {
      return res.status(400).json({
        success: false,
        message: 'No puede desactivarse a sí mismo',
      });
    }

    usuario.activo = activo;
    await usuario.save();

    res.status(200).json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: { usuario },
    });
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de usuario',
      error: error.message,
    });
  }
};

export default {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerUsuariosPorRol,
  obtenerConductoresDisponibles,
  cambiarEstadoUsuario,
};
