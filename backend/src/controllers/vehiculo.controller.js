import Vehiculo from '../models/Vehiculo.js';

/**
 * @desc    Obtener todos los vehículos con paginación y filtros
 * @route   GET /api/vehiculos
 * @access  Private (Autenticado)
 */
export const obtenerVehiculos = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, tipo, search } = req.query;

    // Construir filtros
    const filtros = {};

    if (estado) {
      filtros.estado = estado;
    }

    if (tipo) {
      filtros.tipo = tipo;
    }

    if (search) {
      filtros.$or = [
        { placa: { $regex: search, $options: 'i' } },
        { marca: { $regex: search, $options: 'i' } },
        { modelo: { $regex: search, $options: 'i' } },
      ];
    }

    // Ejecutar consulta con paginación
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const vehiculos = await Vehiculo.find(filtros)
      .populate('conductor_asignado', 'nombre email telefono rol')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Vehiculo.countDocuments(filtros);

    res.status(200).json({
      success: true,
      message: 'Vehículos obtenidos exitosamente',
      data: {
        vehiculos,
        paginacion: {
          total,
          pagina: options.page,
          paginas: Math.ceil(total / options.limit),
          limite: options.limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los vehículos',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener vehículos disponibles
 * @route   GET /api/vehiculos/disponibles
 * @access  Private
 */
export const obtenerVehiculosDisponibles = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.find({ estado: 'disponible' })
      .populate('conductor_asignado', 'nombre email telefono rol')
      .sort({ placa: 1 });

    res.status(200).json({
      success: true,
      message: 'Vehículos disponibles obtenidos exitosamente',
      data: { vehiculos },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener vehículos disponibles',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener vehículo por ID
 * @route   GET /api/vehiculos/:id
 * @access  Private
 */
export const obtenerVehiculoPorId = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id).populate(
      'conductor_asignado',
      'nombre email telefono rol',
    );

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehículo obtenido exitosamente',
      data: { vehiculo },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el vehículo',
      error: error.message,
    });
  }
};

/**
 * @desc    Crear nuevo vehículo
 * @route   POST /api/vehiculos
 * @access  Private (Admin/Coordinador)
 */
export const crearVehiculo = async (req, res) => {
  try {
    const {
      placa,
      marca,
      modelo,
      año,
      tipo,
      capacidad_carga,
      unidad_capacidad,
      estado,
      conductor_asignado,
      kilometraje,
    } = req.body;

    // Validar que no exista un vehículo con la misma placa
    const vehiculoExistente = await Vehiculo.findOne({
      placa: placa.toUpperCase(),
    });
    if (vehiculoExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un vehículo con esa placa',
      });
    }

    const vehiculo = await Vehiculo.create({
      placa: placa.toUpperCase(),
      marca,
      modelo,
      año,
      tipo,
      capacidad_carga,
      unidad_capacidad: unidad_capacidad || 'kg',
      estado: estado || 'disponible',
      conductor_asignado: conductor_asignado || null,
      kilometraje: kilometraje || 0,
    });

    // Poblar conductor asignado para la respuesta
    await vehiculo.populate('conductor_asignado', 'nombre email telefono');

    res.status(201).json({
      success: true,
      message: 'Vehículo creado exitosamente',
      data: { vehiculo },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear el vehículo',
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar vehículo
 * @route   PUT /api/vehiculos/:id
 * @access  Private (Admin/Coordinador)
 */
export const actualizarVehiculo = async (req, res) => {
  try {
    const {
      placa,
      marca,
      modelo,
      año,
      tipo,
      capacidad_carga,
      unidad_capacidad,
      estado,
      conductor_asignado,
      kilometraje,
    } = req.body;

    // Verificar que el vehículo existe
    let vehiculo = await Vehiculo.findById(req.params.id);
    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    // Si se está cambiando la placa, verificar que no exista
    if (placa && placa.toUpperCase() !== vehiculo.placa) {
      const vehiculoExistente = await Vehiculo.findOne({
        placa: placa.toUpperCase(),
      });
      if (vehiculoExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un vehículo con esa placa',
        });
      }
    }

    // Actualizar campos
    vehiculo = await Vehiculo.findByIdAndUpdate(
      req.params.id,
      {
        placa: placa ? placa.toUpperCase() : vehiculo.placa,
        marca,
        modelo,
        año,
        tipo,
        capacidad_carga,
        unidad_capacidad,
        estado,
        conductor_asignado,
        kilometraje,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    // Poblar conductor asignado para la respuesta
    await vehiculo.populate('conductor_asignado', 'nombre email telefono');

    res.status(200).json({
      success: true,
      message: 'Vehículo actualizado exitosamente',
      data: { vehiculo },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el vehículo',
      error: error.message,
    });
  }
};

/**
 * @desc    Cambiar estado del vehículo
 * @route   PATCH /api/vehiculos/:id/estado
 * @access  Private (Admin/Coordinador)
 */
export const cambiarEstadoVehiculo = async (req, res) => {
  try {
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido',
      });
    }

    const vehiculo = await Vehiculo.findById(req.params.id);

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    vehiculo.estado = estado;
    await vehiculo.save();

    res.status(200).json({
      success: true,
      message: 'Estado del vehículo actualizado exitosamente',
      data: { vehiculo },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado del vehículo',
      error: error.message,
    });
  }
};

/**
 * @desc    Eliminar vehículo
 * @route   DELETE /api/vehiculos/:id
 * @access  Private (Admin)
 */
export const eliminarVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id);

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    // Verificar si hay rutas activas con este vehículo
    const Ruta = (await import('../models/Ruta.js')).default;
    const rutasActivas = await Ruta.countDocuments({
      vehiculo: req.params.id,
      estado: { $in: ['planificada', 'en_transito'] },
    });

    if (rutasActivas > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el vehículo porque tiene ${rutasActivas} ruta(s) activa(s)`,
      });
    }

    await vehiculo.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vehículo eliminado exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el vehículo',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener historial de rutas del vehículo
 * @route   GET /api/vehiculos/:id/historial
 * @access  Private
 */
export const obtenerHistorialVehiculo = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findById(req.params.id);

    if (!vehiculo) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    const Ruta = (await import('../models/Ruta.js')).default;
    const rutas = await Ruta.find({ vehiculo: req.params.id })
      .populate('conductor', 'nombre email')
      .sort({ fecha_programada: -1 })
      .limit(50);

    const estadisticas = {
      total_rutas: rutas.length,
      rutas_completadas: rutas.filter((r) => r.estado === 'completada').length,
      rutas_canceladas: rutas.filter((r) => r.estado === 'cancelada').length,
      rutas_en_transito: rutas.filter((r) => r.estado === 'en_transito').length,
    };

    res.status(200).json({
      success: true,
      message: 'Historial obtenido exitosamente',
      data: {
        vehiculo: {
          _id: vehiculo._id,
          placa: vehiculo.placa,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
        },
        estadisticas,
        rutas,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial',
      error: error.message,
    });
  }
};
