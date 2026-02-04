import Ruta from '../models/Ruta.js';
import Vehiculo from '../models/Vehiculo.js';
import Usuario from '../models/Usuario.js';
import Producto from '../models/Producto.js';
import Entrega from '../models/Entrega.js';

/**
 * @desc    Obtener todas las rutas con paginación y filtros
 * @route   GET /api/rutas
 * @access  Private
 */
export const obtenerRutas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      estado,
      conductor,
      vehiculo,
      fecha_desde,
      fecha_hasta,
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (estado) {
      filtros.estado = estado;
    }

    if (conductor) {
      filtros.conductor = conductor;
    }

    if (vehiculo) {
      filtros.vehiculo = vehiculo;
    }

    if (fecha_desde || fecha_hasta) {
      filtros.fecha_programada = {};
      if (fecha_desde) {
        filtros.fecha_programada.$gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        filtros.fecha_programada.$lte = new Date(fecha_hasta);
      }
    }

    // Ejecutar consulta con paginación
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { fecha_programada: -1 },
    };

    const rutas = await Ruta.find(filtros)
      .populate('vehiculo', 'placa marca modelo tipo')
      .populate('conductor', 'nombre email telefono')
      .populate('lista_productos.producto', 'nombre codigo')
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Ruta.countDocuments(filtros);

    res.status(200).json({
      success: true,
      message: 'Rutas obtenidas exitosamente',
      data: {
        rutas,
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
      message: 'Error al obtener las rutas',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener ruta por ID con toda la información
 * @route   GET /api/rutas/:id
 * @access  Private
 */
export const obtenerRutaPorId = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id)
      .populate('vehiculo')
      .populate('conductor', 'nombre email telefono')
      .populate('lista_productos.producto');

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ruta obtenida exitosamente',
      data: { ruta },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la ruta',
      error: error.message,
    });
  }
};

/**
 * @desc    Crear nueva ruta de transporte (RF09)
 * @route   POST /api/rutas
 * @access  Private (Coordinador/Admin)
 */
export const crearRuta = async (req, res) => {
  try {
    const {
      origen,
      destino,
      fecha_programada,
      vehiculo,
      conductor,
      lista_productos,
      distancia_km,
      tiempo_estimado_horas,
      prioridad,
      observaciones,
    } = req.body;

    // Validar que el vehículo existe y está disponible
    const vehiculoDoc = await Vehiculo.findById(vehiculo);
    if (!vehiculoDoc) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    if (vehiculoDoc.estado !== 'disponible') {
      return res.status(400).json({
        success: false,
        message: `El vehículo no está disponible. Estado actual: ${vehiculoDoc.estado}`,
      });
    }

    // Validar que el conductor existe y tiene el rol correcto
    const conductorDoc = await Usuario.findById(conductor);
    if (!conductorDoc) {
      return res.status(404).json({
        success: false,
        message: 'Conductor no encontrado',
      });
    }

    if (conductorDoc.rol !== 'conductor') {
      return res.status(400).json({
        success: false,
        message: 'El usuario seleccionado no tiene rol de conductor',
      });
    }

    // Validar que el conductor no tenga otra ruta activa en el mismo horario (RF08)
    const rutasActivasConductor = await Ruta.countDocuments({
      conductor: conductor,
      estado: { $in: ['planificada', 'en_transito'] },
      fecha_programada: {
        $gte: new Date(fecha_programada),
        $lt: new Date(
          new Date(fecha_programada).getTime() + 24 * 60 * 60 * 1000,
        ),
      },
    });

    if (rutasActivasConductor > 0) {
      return res.status(400).json({
        success: false,
        message: 'El conductor ya tiene una ruta asignada en ese horario',
      });
    }

    // Validar productos y stock disponible
    for (const item of lista_productos) {
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `Producto ${item.producto} no encontrado`,
        });
      }

      if (producto.stock_actual < item.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock_actual}, Solicitado: ${item.cantidad}`,
        });
      }
    }

    // Crear la ruta
    const ruta = await Ruta.create({
      origen,
      destino,
      fecha_programada,
      vehiculo,
      conductor,
      lista_productos,
      distancia_km,
      tiempo_estimado_horas,
      prioridad: prioridad || 'media',
      observaciones,
      estado: 'planificada',
    });

    // Cambiar estado del vehículo a "en ruta" cuando se crea la ruta
    // vehiculoDoc.estado = 'en_ruta';
    // await vehiculoDoc.save();

    // Poblar datos para la respuesta
    await ruta.populate('vehiculo conductor lista_productos.producto');

    res.status(201).json({
      success: true,
      message: 'Ruta creada exitosamente',
      data: { ruta },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear la ruta',
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar ruta
 * @route   PUT /api/rutas/:id
 * @access  Private (Coordinador/Admin)
 */
export const actualizarRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    // No permitir actualizar si la ruta está completada o cancelada
    if (['completada', 'cancelada'].includes(ruta.estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede actualizar una ruta en estado ${ruta.estado}`,
      });
    }

    const rutaActualizada = await Ruta.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    ).populate('vehiculo conductor lista_productos.producto');

    res.status(200).json({
      success: true,
      message: 'Ruta actualizada exitosamente',
      data: { ruta: rutaActualizada },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la ruta',
      error: error.message,
    });
  }
};

/**
 * @desc    Cambiar estado de la ruta (RF10)
 * @route   PATCH /api/rutas/:id/estado
 * @access  Private (Coordinador/Conductor/Admin)
 */
export const cambiarEstadoRuta = async (req, res) => {
  try {
    const { estado, motivo_cancelacion } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido',
      });
    }

    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      planificada: ['en_transito', 'cancelada'],
      en_transito: ['completada', 'cancelada'],
      completada: [],
      cancelada: [],
    };

    if (!transicionesValidas[ruta.estado].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de ${ruta.estado} a ${estado}`,
      });
    }

    // Actualizar estado y campos relacionados
    ruta.estado = estado;

    if (estado === 'en_transito') {
      ruta.fecha_inicio_real = new Date();
      // Actualizar vehículo a en_ruta
      await Vehiculo.findByIdAndUpdate(ruta.vehiculo, { estado: 'en_ruta' });
    }

    if (estado === 'completada') {
      ruta.fecha_fin_real = new Date();
      // Liberar vehículo
      await Vehiculo.findByIdAndUpdate(ruta.vehiculo, { estado: 'disponible' });

      // Crear entrega automáticamente cuando la ruta se completa
      await ruta.populate('conductor vehiculo lista_productos.producto');

      const entrega = await Entrega.create({
        ruta: ruta._id,
        conductor: ruta.conductor._id,
        vehiculo: ruta.vehiculo._id,
        cliente: {
          nombre: ruta.destino.nombre,
          direccion: ruta.destino.direccion,
          telefono: ruta.destino.contacto?.telefono,
          email: ruta.destino.contacto?.email,
          coordenadas: ruta.destino.coordenadas,
        },
        origen: {
          nombre: ruta.origen.nombre,
          direccion: ruta.origen.direccion,
          coordenadas: ruta.origen.coordenadas,
        },
        productos: ruta.lista_productos.map((p) => ({
          producto: p.producto._id,
          cantidadProgramada: p.cantidad,
          cantidadEntregada: p.cantidad, // Se entrega todo al completar
        })),
        fecha_programada: ruta.fecha_programada,
        fecha_entrega: new Date(),
        distanciaTotal: ruta.distancia_km || 0,
        tiempoEstimadoLlegada: (ruta.tiempo_estimado_horas || 1) * 60,
        estado: 'entregado',
      });

      // Agregar la entrega creada a la respuesta
      ruta._doc.entregaCreada = entrega._id;
    }

    if (estado === 'cancelada') {
      ruta.motivo_cancelacion = motivo_cancelacion;
      // Liberar vehículo
      await Vehiculo.findByIdAndUpdate(ruta.vehiculo, { estado: 'disponible' });
    }

    await ruta.save();
    await ruta.populate('vehiculo conductor lista_productos.producto');

    res.status(200).json({
      success: true,
      message: `Ruta ${estado} exitosamente`,
      data: { ruta },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la ruta',
      error: error.message,
    });
  }
};

/**
 * @desc    Iniciar ruta - Marca el inicio del viaje (RF10)
 * @route   POST /api/rutas/:id/iniciar
 * @access  Private (Conductor/Coordinador/Admin)
 */
export const iniciarRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    if (ruta.estado !== 'planificada') {
      return res.status(400).json({
        success: false,
        message: `La ruta no puede iniciarse desde el estado ${ruta.estado}`,
      });
    }

    // Solo el conductor asignado puede iniciar la ruta
    if (
      req.usuario.rol === 'conductor' &&
      ruta.conductor.toString() !== req.usuario._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Solo el conductor asignado puede iniciar esta ruta',
      });
    }

    ruta.estado = 'en_transito';
    ruta.fecha_inicio_real = new Date();
    await ruta.save();

    // Actualizar vehículo
    await Vehiculo.findByIdAndUpdate(ruta.vehiculo, { estado: 'en_ruta' });

    await ruta.populate('vehiculo conductor lista_productos.producto');

    res.status(200).json({
      success: true,
      message: 'Ruta iniciada exitosamente',
      data: { ruta },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar la ruta',
      error: error.message,
    });
  }
};

/**
 * @desc    Registrar entrega de productos (RF11)
 * @route   POST /api/rutas/:id/entrega
 * @access  Private (Conductor/Coordinador/Admin)
 */
export const registrarEntrega = async (req, res) => {
  try {
    const { productos_entregados, observaciones } = req.body;

    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    if (ruta.estado !== 'en_transito') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden registrar entregas de rutas en tránsito',
      });
    }

    // Actualizar cantidades entregadas
    productos_entregados.forEach((itemEntregado) => {
      const producto = ruta.lista_productos.id(itemEntregado.producto_id);
      if (producto) {
        producto.entregado = itemEntregado.cantidad_entregada;
      }
    });

    // Verificar si todos los productos fueron entregados
    const todosEntregados = ruta.lista_productos.every(
      (p) => p.entregado === p.cantidad,
    );

    if (todosEntregados) {
      ruta.estado = 'completada';
      ruta.fecha_fin_real = new Date();
      // Liberar vehículo
      await Vehiculo.findByIdAndUpdate(ruta.vehiculo, { estado: 'disponible' });
    }

    if (observaciones) {
      ruta.observaciones = (ruta.observaciones || '') + '\n' + observaciones;
    }

    await ruta.save();
    await ruta.populate('vehiculo conductor lista_productos.producto');

    res.status(200).json({
      success: true,
      message: 'Entrega registrada exitosamente',
      data: { ruta },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar la entrega',
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar ubicación GPS de la ruta (RF13 - Tracking)
 * @route   POST /api/rutas/:id/tracking
 * @access  Private (Conductor/Admin)
 */
export const actualizarTracking = async (req, res) => {
  try {
    const { latitud, longitud, velocidad, observacion } = req.body;

    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    if (ruta.estado !== 'en_transito') {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede hacer tracking de rutas en tránsito',
      });
    }

    // Agregar punto de tracking
    ruta.tracking.push({
      fecha: new Date(),
      latitud,
      longitud,
      velocidad: velocidad || 0,
      observacion,
    });

    await ruta.save();

    res.status(200).json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
      data: {
        ultimo_tracking: ruta.tracking[ruta.tracking.length - 1],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tracking',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener tracking de una ruta (RF13)
 * @route   GET /api/rutas/:id/tracking
 * @access  Private
 */
export const obtenerTracking = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id)
      .select('tracking estado numeroRuta vehiculo conductor')
      .populate('vehiculo', 'placa marca modelo')
      .populate('conductor', 'nombre telefono');

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tracking obtenido exitosamente',
      data: {
        ruta: {
          _id: ruta._id,
          numeroRuta: ruta.numeroRuta,
          estado: ruta.estado,
        },
        vehiculo: ruta.vehiculo,
        conductor: ruta.conductor,
        tracking: ruta.tracking,
        ultima_posicion:
          ruta.tracking.length > 0
            ? ruta.tracking[ruta.tracking.length - 1]
            : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener tracking',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener historial de entregas (RF14)
 * @route   GET /api/rutas/historial/entregas
 * @access  Private
 */
export const obtenerHistorialEntregas = async (req, res) => {
  try {
    const { conductor, desde, hasta, estado } = req.query;

    const filtros = { estado: { $in: ['completada', 'cancelada'] } };

    if (conductor) {
      filtros.conductor = conductor;
    }

    if (desde || hasta) {
      filtros.fecha_programada = {};
      if (desde) {
        filtros.fecha_programada.$gte = new Date(desde);
      }
      if (hasta) {
        filtros.fecha_programada.$lte = new Date(hasta);
      }
    }

    if (estado) {
      filtros.estado = estado;
    }

    const rutas = await Ruta.find(filtros)
      .populate('vehiculo', 'placa marca modelo')
      .populate('conductor', 'nombre email')
      .populate('lista_productos.producto', 'nombre codigo')
      .sort({ fecha_fin_real: -1 })
      .limit(100);

    const estadisticas = {
      total: rutas.length,
      completadas: rutas.filter((r) => r.estado === 'completada').length,
      canceladas: rutas.filter((r) => r.estado === 'cancelada').length,
    };

    res.status(200).json({
      success: true,
      message: 'Historial obtenido exitosamente',
      data: {
        rutas,
        estadisticas,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial',
      error: error.message,
    });
  }
};

/**
 * @desc    Eliminar ruta
 * @route   DELETE /api/rutas/:id
 * @access  Private (Admin)
 */
export const eliminarRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    // Solo permitir eliminar rutas que no estén en tránsito
    if (ruta.estado === 'en_transito') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una ruta en tránsito',
      });
    }

    await ruta.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Ruta eliminada exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la ruta',
      error: error.message,
    });
  }
};
