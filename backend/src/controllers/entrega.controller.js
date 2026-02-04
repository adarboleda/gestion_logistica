import Entrega from '../models/Entrega.js';
import Ruta from '../models/Ruta.js';
import Usuario from '../models/Usuario.js';
import Vehiculo from '../models/Vehiculo.js';

/**
 * CONTROLADOR DE ENTREGAS - SIMPLIFICADO
 *
 * Las entregas se crean automáticamente cuando una Ruta cambia a estado 'en_transito'.
 * El conductor usa este módulo solo para marcar el estado final de la entrega.
 *
 * IMPORTANTE: El tracking GPS está en el módulo de Rutas, no aquí.
 *
 * Estados de entrega:
 * - pendiente: Ruta en tránsito, esperando llegada
 * - entregado: Entrega completada exitosamente
 * - parcial: Entrega parcial (no todos los productos)
 * - rechazado: Cliente rechazó la entrega
 * - no_encontrado: No se encontró al cliente
 * - reprogramado: Se debe reprogramar
 */

/**
 * @desc    Crear nueva entrega
 * @route   POST /api/entregas
 * @access  Privado (Admin/Coordinador)
 */
export const crearEntrega = async (req, res) => {
  try {
    const {
      ruta,
      conductor,
      vehiculo,
      cliente,
      origen,
      productos,
      fecha_programada,
      tiempoEstimadoLlegada,
      distanciaTotal,
      observaciones,
    } = req.body;

    // Validar ruta si se proporciona
    if (ruta) {
      const rutaExiste = await Ruta.findById(ruta);
      if (!rutaExiste) {
        return res.status(404).json({
          success: false,
          message: 'Ruta no encontrada',
        });
      }
    }

    // Validar conductor
    const conductorExiste = await Usuario.findById(conductor);
    if (!conductorExiste || conductorExiste.rol !== 'conductor') {
      return res.status(400).json({
        success: false,
        message: 'El conductor no es válido',
      });
    }

    // Validar vehículo
    const vehiculoExiste = await Vehiculo.findById(vehiculo);
    if (!vehiculoExiste) {
      return res.status(404).json({
        success: false,
        message: 'Vehículo no encontrado',
      });
    }

    const entrega = await Entrega.create({
      ruta,
      conductor,
      vehiculo,
      cliente,
      origen,
      productos,
      fecha_programada,
      tiempoEstimadoLlegada,
      distanciaTotal,
      observaciones,
    });

    await entrega.populate([
      { path: 'conductor', select: 'nombre email telefono' },
      { path: 'vehiculo', select: 'placa marca modelo' },
      { path: 'productos.producto', select: 'nombre codigo' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Entrega creada exitosamente',
      data: { entrega },
    });
  } catch (error) {
    console.error('Error al crear entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la entrega',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener todas las entregas con filtros
 * @route   GET /api/entregas
 * @access  Privado
 */
export const obtenerEntregas = async (req, res) => {
  try {
    const {
      estado,
      conductor,
      ruta,
      fecha_desde,
      fecha_hasta,
      periodo, // hoy, semana, mes
      page = 1,
      limit = 20,
    } = req.query;

    const filtro = {};

    if (estado) filtro.estado = estado;
    if (conductor) filtro.conductor = conductor;
    if (ruta) filtro.ruta = ruta;

    // Filtro por periodo
    const ahora = new Date();
    if (periodo === 'hoy') {
      const inicioHoy = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate(),
      );
      const finHoy = new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate() + 1,
      );
      filtro.fecha_programada = { $gte: inicioHoy, $lt: finHoy };
    } else if (periodo === 'semana') {
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - ahora.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      filtro.fecha_programada = { $gte: inicioSemana };
    } else if (periodo === 'mes') {
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      filtro.fecha_programada = { $gte: inicioMes };
    } else if (fecha_desde || fecha_hasta) {
      filtro.fecha_programada = {};
      if (fecha_desde) filtro.fecha_programada.$gte = new Date(fecha_desde);
      if (fecha_hasta) filtro.fecha_programada.$lte = new Date(fecha_hasta);
    }

    const skip = (page - 1) * limit;

    const entregas = await Entrega.find(filtro)
      .populate('conductor', 'nombre email telefono')
      .populate('vehiculo', 'placa marca modelo')
      .populate('ruta', 'numeroRuta origen destino')
      .populate('productos.producto', 'nombre codigo')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ fecha_programada: -1 });

    const total = await Entrega.countDocuments(filtro);

    // Estadísticas con los nuevos estados
    const estadisticas = {
      total,
      pendientes: await Entrega.countDocuments({
        ...filtro,
        estado: 'pendiente',
      }),
      entregadas: await Entrega.countDocuments({
        ...filtro,
        estado: 'entregado',
      }),
      parciales: await Entrega.countDocuments({
        ...filtro,
        estado: 'parcial',
      }),
      rechazadas: await Entrega.countDocuments({
        ...filtro,
        estado: 'rechazado',
      }),
      no_encontradas: await Entrega.countDocuments({
        ...filtro,
        estado: 'no_encontrado',
      }),
      reprogramadas: await Entrega.countDocuments({
        ...filtro,
        estado: 'reprogramado',
      }),
    };

    res.status(200).json({
      success: true,
      data: {
        entregas,
        estadisticas,
        paginacion: {
          total,
          pagina: parseInt(page),
          limite: parseInt(limit),
          totalPaginas: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregas',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener entrega por ID
 * @route   GET /api/entregas/:id
 * @access  Privado
 */
export const obtenerEntregaPorId = async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id)
      .populate('conductor', 'nombre email telefono')
      .populate('vehiculo', 'placa marca modelo tipo')
      .populate('ruta', 'numeroRuta origen destino estado')
      .populate('productos.producto', 'nombre codigo imagen');

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      data: { entrega },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la entrega',
      error: error.message,
    });
  }
};

/**
 * @desc    Marcar estado de entrega (conductor marca resultado final)
 * @route   PATCH /api/entregas/:id/estado
 * @access  Privado (Conductor)
 */
export const actualizarEstadoEntrega = async (req, res) => {
  try {
    const {
      estado,
      motivoNoEntrega,
      observaciones,
      productosEntregados, // Para entregas parciales: [{productoId, cantidadEntregada, observacion}]
      firma,
      fotoEntrega,
      calificacion,
    } = req.body;

    const entrega = await Entrega.findById(req.params.id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    // Solo se pueden modificar entregas pendientes
    if (entrega.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden modificar entregas pendientes',
      });
    }

    // Validar estado
    const estadosValidos = [
      'entregado',
      'parcial',
      'rechazado',
      'no_encontrado',
      'reprogramado',
    ];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Use: ${estadosValidos.join(', ')}`,
      });
    }

    entrega.estado = estado;
    entrega.fecha_entrega = new Date();

    if (observaciones) entrega.observaciones = observaciones;
    if (firma) entrega.firma = firma;
    if (fotoEntrega) entrega.fotoEntrega = fotoEntrega;
    if (calificacion) entrega.calificacion = calificacion;

    // Según el estado, manejar productos y motivos
    if (estado === 'entregado') {
      // Marcar todos los productos como entregados completamente
      entrega.productos.forEach((p) => {
        p.cantidadEntregada = p.cantidadProgramada;
      });
    } else if (estado === 'parcial') {
      // Actualizar cantidades entregadas por producto
      if (productosEntregados && Array.isArray(productosEntregados)) {
        productosEntregados.forEach((pe) => {
          const producto = entrega.productos.find(
            (p) => p.producto.toString() === pe.productoId.toString(),
          );
          if (producto) {
            producto.cantidadEntregada = pe.cantidadEntregada;
            if (pe.observacion) producto.observacion = pe.observacion;
          }
        });
      }
    } else {
      // Estados: rechazado, no_encontrado, reprogramado
      if (motivoNoEntrega) entrega.motivoNoEntrega = motivoNoEntrega;
    }

    await entrega.save();
    await entrega.populate([
      { path: 'conductor', select: 'nombre email' },
      { path: 'vehiculo', select: 'placa marca' },
      { path: 'ruta', select: 'numeroRuta estado' },
    ]);

    res.status(200).json({
      success: true,
      message: `Entrega marcada como ${estado}`,
      data: { entrega },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener historial de entregas por periodo
 * @route   GET /api/entregas/historial
 * @access  Privado
 */
export const obtenerHistorialEntregas = async (req, res) => {
  try {
    const { periodo = 'mes', conductor } = req.query;

    const ahora = new Date();
    let fechaInicio;

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
        );
        break;
      case 'semana':
        fechaInicio = new Date(ahora);
        fechaInicio.setDate(ahora.getDate() - 7);
        break;
      case 'mes':
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
    }

    const filtro = {
      fecha_programada: { $gte: fechaInicio },
    };

    if (conductor) {
      filtro.conductor = conductor;
    }

    const entregas = await Entrega.find(filtro)
      .populate('conductor', 'nombre')
      .populate('vehiculo', 'placa')
      .sort({ fecha_programada: -1 });

    // Estadísticas por estado (nuevos estados)
    const estadisticas = {
      total: entregas.length,
      pendientes: entregas.filter((e) => e.estado === 'pendiente').length,
      entregadas: entregas.filter((e) => e.estado === 'entregado').length,
      parciales: entregas.filter((e) => e.estado === 'parcial').length,
      rechazadas: entregas.filter((e) => e.estado === 'rechazado').length,
      no_encontradas: entregas.filter((e) => e.estado === 'no_encontrado')
        .length,
      reprogramadas: entregas.filter((e) => e.estado === 'reprogramado').length,
      tasaExito:
        entregas.length > 0
          ? Math.round(
              (entregas.filter((e) =>
                ['entregado', 'parcial'].includes(e.estado),
              ).length /
                entregas.length) *
                100,
            )
          : 0,
    };

    // Agrupar por día
    const entregasPorDia = {};
    entregas.forEach((e) => {
      const fecha = e.fecha_programada.toISOString().split('T')[0];
      if (!entregasPorDia[fecha]) {
        entregasPorDia[fecha] = { total: 0, entregadas: 0 };
      }
      entregasPorDia[fecha].total++;
      if (e.estado === 'entregado') {
        entregasPorDia[fecha].entregadas++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        entregas,
        estadisticas,
        entregasPorDia,
        periodo,
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
 * @desc    Crear entrega desde ruta (cuando cambia a en_transito)
 * @route   POST /api/entregas/desde-ruta/:rutaId
 * @access  Privado (Sistema interno)
 */
export const crearEntregaDesdeRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.rutaId)
      .populate('conductor')
      .populate('vehiculo')
      .populate('lista_productos.producto');

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
      });
    }

    // Verificar si ya existe una entrega para esta ruta
    const entregaExistente = await Entrega.findOne({ ruta: ruta._id });
    if (entregaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una entrega para esta ruta',
        data: { entrega: entregaExistente },
      });
    }

    // Crear entrega basada en la ruta (sin coordenadas)
    const entrega = await Entrega.create({
      ruta: ruta._id,
      conductor: ruta.conductor._id,
      vehiculo: ruta.vehiculo._id,
      cliente: {
        nombre: ruta.destino.nombre,
        direccion: ruta.destino.direccion,
        telefono: ruta.destino.contacto?.telefono,
        email: ruta.destino.contacto?.email,
      },
      origen: {
        nombre: ruta.origen.nombre,
        direccion: ruta.origen.direccion,
      },
      productos: ruta.lista_productos.map((p) => ({
        producto: p.producto._id,
        cantidadProgramada: p.cantidad,
        cantidadEntregada: 0,
      })),
      fecha_programada: ruta.fecha_programada,
    });

    await entrega.populate([
      { path: 'conductor', select: 'nombre email telefono' },
      { path: 'vehiculo', select: 'placa marca modelo' },
      { path: 'productos.producto', select: 'nombre codigo' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Entrega creada desde ruta exitosamente',
      data: { entrega },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear entrega desde ruta',
      error: error.message,
    });
  }
};

/**
 * @desc    Eliminar entrega
 * @route   DELETE /api/entregas/:id
 * @access  Privado (Admin)
 */
export const eliminarEntrega = async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (entrega.estado === 'en_proceso') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una entrega en proceso',
      });
    }

    await entrega.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Entrega eliminada exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar entrega',
      error: error.message,
    });
  }
};
