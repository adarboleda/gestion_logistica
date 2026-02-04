import Entrega from '../models/Entrega.js';
import Ruta from '../models/Ruta.js';
import Usuario from '../models/Usuario.js';
import Vehiculo from '../models/Vehiculo.js';

// Lista de ubicaciones simuladas para Ecuador (ciudades principales)
const ubicacionesEcuador = [
  {
    nombre: 'Quito - Centro Histórico',
    latitud: -0.2201641,
    longitud: -78.5123274,
  },
  { nombre: 'Quito - La Mariscal', latitud: -0.2065152, longitud: -78.4924876 },
  { nombre: 'Quito - Norte', latitud: -0.1234952, longitud: -78.4818278 },
  { nombre: 'Guayaquil - Centro', latitud: -2.1894128, longitud: -79.8890662 },
  { nombre: 'Guayaquil - Norte', latitud: -2.1543252, longitud: -79.9020532 },
  { nombre: 'Cuenca - Centro', latitud: -2.8972043, longitud: -79.0044058 },
  { nombre: 'Ambato', latitud: -1.2543407, longitud: -78.6228503 },
  { nombre: 'Manta', latitud: -0.9676533, longitud: -80.7089101 },
  { nombre: 'Portoviejo', latitud: -1.0546475, longitud: -80.4541669 },
  { nombre: 'Machala', latitud: -3.2581053, longitud: -79.9553924 },
  { nombre: 'Loja', latitud: -3.9931355, longitud: -79.2042158 },
  { nombre: 'Santo Domingo', latitud: -0.2531799, longitud: -79.1718841 },
  { nombre: 'Ibarra', latitud: 0.3516889, longitud: -78.1224693 },
  { nombre: 'Riobamba', latitud: -1.6635508, longitud: -78.6546409 },
  { nombre: 'Esmeraldas', latitud: 0.9592229, longitud: -79.6539406 },
];

// Función para generar ubicación intermedia entre dos puntos
const generarUbicacionIntermedia = (origen, destino, progreso) => {
  const lat = origen.latitud + (destino.latitud - origen.latitud) * progreso;
  const lng = origen.longitud + (destino.longitud - origen.longitud) * progreso;
  return { latitud: lat, longitud: lng };
};

// Función para obtener nombre aleatorio de ubicación
const obtenerNombreUbicacionAleatorio = () => {
  const ubicaciones = ubicacionesEcuador;
  return ubicaciones[Math.floor(Math.random() * ubicaciones.length)].nombre;
};

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
      fecha_desde,
      fecha_hasta,
      periodo, // hoy, semana, mes
      page = 1,
      limit = 20,
    } = req.query;

    const filtro = {};

    if (estado) filtro.estado = estado;
    if (conductor) filtro.conductor = conductor;

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

    // Estadísticas
    const estadisticas = {
      total,
      pendientes: await Entrega.countDocuments({
        ...filtro,
        estado: 'pendiente',
      }),
      en_proceso: await Entrega.countDocuments({
        ...filtro,
        estado: 'en_proceso',
      }),
      entregadas: await Entrega.countDocuments({
        ...filtro,
        estado: 'entregado',
      }),
      retrasadas: await Entrega.countDocuments({
        ...filtro,
        estado: 'retrasado',
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
 * @desc    Actualizar estado de entrega
 * @route   PATCH /api/entregas/:id/estado
 * @access  Privado
 */
export const actualizarEstadoEntrega = async (req, res) => {
  try {
    const { estado, motivoRetraso, observaciones } = req.body;

    const entrega = await Entrega.findById(req.params.id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    // Validar transiciones de estado
    const transicionesValidas = {
      pendiente: ['en_proceso', 'cancelado'],
      en_proceso: ['entregado', 'retrasado', 'cancelado'],
      retrasado: ['en_proceso', 'entregado', 'cancelado'],
      entregado: [],
      cancelado: [],
    };

    if (!transicionesValidas[entrega.estado].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de ${entrega.estado} a ${estado}`,
      });
    }

    entrega.estado = estado;

    if (estado === 'en_proceso') {
      entrega.fecha_inicio = entrega.fecha_inicio || new Date();
      entrega.trackingActivo = true;
    }

    if (estado === 'entregado') {
      entrega.fecha_entrega = new Date();
      entrega.trackingActivo = false;
    }

    if (estado === 'retrasado' && motivoRetraso) {
      entrega.motivoRetraso = motivoRetraso;
    }

    if (observaciones) {
      entrega.observaciones = observaciones;
    }

    await entrega.save();
    await entrega.populate([
      { path: 'conductor', select: 'nombre email' },
      { path: 'vehiculo', select: 'placa marca' },
    ]);

    res.status(200).json({
      success: true,
      message: `Entrega actualizada a ${estado}`,
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
 * @desc    Iniciar tracking simulado de entrega
 * @route   POST /api/entregas/:id/iniciar-tracking
 * @access  Privado
 */
export const iniciarTrackingSimulado = async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (entrega.estado === 'pendiente') {
      entrega.estado = 'en_proceso';
      entrega.fecha_inicio = new Date();
    }

    entrega.trackingActivo = true;

    // Agregar ubicación inicial
    const ubicacionInicial = entrega.origen?.coordenadas || {
      latitud: -0.2201641,
      longitud: -78.5123274,
    };

    entrega.ubicacionActual = {
      latitud: ubicacionInicial.latitud,
      longitud: ubicacionInicial.longitud,
      nombreUbicacion: entrega.origen?.nombre || 'Punto de origen',
      ultimaActualizacion: new Date(),
    };

    entrega.tracking.push({
      latitud: ubicacionInicial.latitud,
      longitud: ubicacionInicial.longitud,
      nombreUbicacion: entrega.origen?.nombre || 'Inicio de recorrido',
      velocidad: 0,
      porcentajeRecorrido: 0,
    });

    await entrega.save();

    res.status(200).json({
      success: true,
      message: 'Tracking simulado iniciado',
      data: { entrega },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar tracking',
      error: error.message,
    });
  }
};

/**
 * @desc    Simular actualización de ubicación (para demo)
 * @route   POST /api/entregas/:id/simular-ubicacion
 * @access  Privado
 */
export const simularActualizacionUbicacion = async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (!entrega.trackingActivo) {
      return res.status(400).json({
        success: false,
        message: 'El tracking no está activo para esta entrega',
      });
    }

    // Calcular progreso actual
    const ultimoTracking = entrega.tracking[entrega.tracking.length - 1];
    const progresoActual = ultimoTracking?.porcentajeRecorrido || 0;

    // Incrementar progreso aleatorio entre 5% y 15%
    const incremento = Math.random() * 10 + 5;
    const nuevoProgreso = Math.min(progresoActual + incremento, 100);

    // Generar ubicación intermedia
    const origen = entrega.origen?.coordenadas || {
      latitud: -0.2201641,
      longitud: -78.5123274,
    };
    const destino = entrega.cliente?.coordenadas || {
      latitud: -2.1894128,
      longitud: -79.8890662,
    };
    const nuevaUbicacion = generarUbicacionIntermedia(
      origen,
      destino,
      nuevoProgreso / 100,
    );

    // Generar velocidad aleatoria entre 20 y 80 km/h
    const velocidad = Math.floor(Math.random() * 60) + 20;

    // Nombre de ubicación aleatorio
    const nombreUbicacion = obtenerNombreUbicacionAleatorio();

    const puntoTracking = {
      latitud: nuevaUbicacion.latitud,
      longitud: nuevaUbicacion.longitud,
      nombreUbicacion,
      velocidad,
      porcentajeRecorrido: nuevoProgreso,
      fecha: new Date(),
    };

    entrega.tracking.push(puntoTracking);
    entrega.ubicacionActual = {
      latitud: nuevaUbicacion.latitud,
      longitud: nuevaUbicacion.longitud,
      nombreUbicacion,
      ultimaActualizacion: new Date(),
    };

    // Calcular distancia recorrida
    if (entrega.distanciaTotal) {
      entrega.distanciaRecorrida =
        (nuevoProgreso / 100) * entrega.distanciaTotal;
    }

    // Si llegó al 100%, marcar como entregado
    if (nuevoProgreso >= 100) {
      entrega.estado = 'entregado';
      entrega.fecha_entrega = new Date();
      entrega.trackingActivo = false;

      // Marcar productos como entregados
      entrega.productos.forEach((p) => {
        p.cantidadEntregada = p.cantidadProgramada;
      });
    }

    await entrega.save();

    res.status(200).json({
      success: true,
      message:
        nuevoProgreso >= 100 ? '¡Entrega completada!' : 'Ubicación actualizada',
      data: {
        ubicacionActual: entrega.ubicacionActual,
        tracking: puntoTracking,
        progreso: nuevoProgreso,
        estado: entrega.estado,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al simular ubicación',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener tracking de una entrega
 * @route   GET /api/entregas/:id/tracking
 * @access  Privado
 */
export const obtenerTracking = async (req, res) => {
  try {
    const entrega = await Entrega.findById(req.params.id)
      .select(
        'tracking ubicacionActual trackingActivo estado numeroEntrega cliente origen distanciaTotal distanciaRecorrida',
      )
      .populate('conductor', 'nombre telefono')
      .populate('vehiculo', 'placa marca modelo');

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    // Calcular tiempo estimado restante (simulado)
    const progresoActual =
      entrega.tracking.length > 0
        ? entrega.tracking[entrega.tracking.length - 1].porcentajeRecorrido
        : 0;
    const tiempoRestante = Math.round((100 - progresoActual) * 0.5); // ~0.5 min por %

    res.status(200).json({
      success: true,
      data: {
        entrega: {
          _id: entrega._id,
          numeroEntrega: entrega.numeroEntrega,
          estado: entrega.estado,
          trackingActivo: entrega.trackingActivo,
        },
        origen: entrega.origen,
        destino: entrega.cliente,
        conductor: entrega.conductor,
        vehiculo: entrega.vehiculo,
        ubicacionActual: entrega.ubicacionActual,
        tracking: entrega.tracking,
        progreso: progresoActual,
        distanciaTotal: entrega.distanciaTotal,
        distanciaRecorrida: entrega.distanciaRecorrida,
        tiempoEstimadoRestante: tiempoRestante,
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

    // Estadísticas por estado
    const estadisticas = {
      total: entregas.length,
      pendientes: entregas.filter((e) => e.estado === 'pendiente').length,
      en_proceso: entregas.filter((e) => e.estado === 'en_proceso').length,
      entregadas: entregas.filter((e) => e.estado === 'entregado').length,
      retrasadas: entregas.filter((e) => e.estado === 'retrasado').length,
      canceladas: entregas.filter((e) => e.estado === 'cancelado').length,
      tasaExito:
        entregas.length > 0
          ? Math.round(
              (entregas.filter((e) => e.estado === 'entregado').length /
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
 * @desc    Completar entrega con firma y foto
 * @route   POST /api/entregas/:id/completar
 * @access  Privado
 */
export const completarEntrega = async (req, res) => {
  try {
    const {
      firma,
      fotoEntrega,
      observaciones,
      calificacion,
      productosEntregados,
    } = req.body;

    const entrega = await Entrega.findById(req.params.id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (entrega.estado !== 'en_proceso' && entrega.estado !== 'retrasado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden completar entregas en proceso o retrasadas',
      });
    }

    // Actualizar productos entregados
    if (productosEntregados && Array.isArray(productosEntregados)) {
      productosEntregados.forEach((pe) => {
        const producto = entrega.productos.find(
          (p) => p.producto.toString() === pe.producto,
        );
        if (producto) {
          producto.cantidadEntregada = pe.cantidadEntregada;
          if (pe.observacion) producto.observacion = pe.observacion;
        }
      });
    } else {
      // Marcar todos como entregados completos
      entrega.productos.forEach((p) => {
        p.cantidadEntregada = p.cantidadProgramada;
      });
    }

    entrega.estado = 'entregado';
    entrega.fecha_entrega = new Date();
    entrega.trackingActivo = false;

    if (firma) entrega.firma = firma;
    if (fotoEntrega) entrega.fotoEntrega = fotoEntrega;
    if (observaciones) entrega.observaciones = observaciones;
    if (calificacion) entrega.calificacion = calificacion;

    // Agregar punto final de tracking
    if (entrega.cliente?.coordenadas) {
      entrega.tracking.push({
        latitud: entrega.cliente.coordenadas.latitud,
        longitud: entrega.cliente.coordenadas.longitud,
        nombreUbicacion: 'Punto de entrega - Finalizado',
        porcentajeRecorrido: 100,
        velocidad: 0,
      });
    }

    await entrega.save();
    await entrega.populate([
      { path: 'conductor', select: 'nombre email' },
      { path: 'productos.producto', select: 'nombre codigo' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Entrega completada exitosamente',
      data: { entrega },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al completar entrega',
      error: error.message,
    });
  }
};

/**
 * @desc    Crear entrega desde ruta completada
 * @route   POST /api/entregas/desde-ruta/:rutaId
 * @access  Privado
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

    // Crear entrega basada en la ruta
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
        cantidadEntregada: 0,
      })),
      fecha_programada: ruta.fecha_programada,
      distanciaTotal: ruta.distancia_km,
      tiempoEstimadoLlegada: ruta.tiempo_estimado_horas * 60,
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
