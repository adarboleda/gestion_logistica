import Movimiento from '../models/Movimiento.js';
import Producto from '../models/Producto.js';
import Bodega from '../models/Bodega.js';

/**
 * @desc    Crear nuevo movimiento de inventario
 * @route   POST /api/movimientos
 * @access  Privado (Admin/Operador)
 * @note    El stock se actualiza automáticamente mediante el hook pre-save del modelo
 */
export const crearMovimiento = async (req, res) => {
  try {
    const {
      tipo,
      producto: productoId,
      cantidad,
      bodegaOrigen,
      bodegaDestino,
      motivoMovimiento,
      observaciones,
      documentoReferencia,
    } = req.body;

    // Validar campos requeridos
    if (!tipo || !productoId || !cantidad || !motivoMovimiento) {
      return res.status(400).json({
        success: false,
        message:
          'Por favor proporcione tipo, producto, cantidad y motivo del movimiento',
      });
    }

    // Validar tipo de movimiento
    const tiposValidos = ['entrada', 'salida', 'transferencia'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de movimiento inválido. Tipos válidos: ${tiposValidos.join(', ')}`,
      });
    }

    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    if (!producto.activo) {
      return res.status(400).json({
        success: false,
        message: 'El producto está inactivo',
      });
    }

    // Validaciones específicas por tipo de movimiento
    if (tipo === 'transferencia') {
      if (!bodegaOrigen || !bodegaDestino) {
        return res.status(400).json({
          success: false,
          message: 'Las transferencias requieren bodega de origen y destino',
        });
      }

      if (bodegaOrigen === bodegaDestino) {
        return res.status(400).json({
          success: false,
          message: 'La bodega de origen y destino no pueden ser la misma',
        });
      }

      // Verificar que las bodegas existen
      const origen = await Bodega.findById(bodegaOrigen);
      const destino = await Bodega.findById(bodegaDestino);

      if (!origen || !destino) {
        return res.status(404).json({
          success: false,
          message: 'Bodega de origen o destino no encontrada',
        });
      }

      if (origen.estado !== 'activa' || destino.estado !== 'activa') {
        return res.status(400).json({
          success: false,
          message: 'Las bodegas deben estar activas',
        });
      }
    }

    // Validar que hay stock suficiente para salidas y transferencias
    if (tipo === 'salida' || tipo === 'transferencia') {
      if (producto.stock_actual < cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Stock actual: ${producto.stock_actual}, Cantidad solicitada: ${cantidad}`,
          stockActual: producto.stock_actual,
          cantidadSolicitada: cantidad,
          faltante: cantidad - producto.stock_actual,
        });
      }
    }

    // Crear movimiento
    // IMPORTANTE: El hook pre-save del modelo Movimiento actualizará automáticamente el stock
    const movimiento = await Movimiento.create({
      tipo,
      producto: productoId,
      cantidad,
      usuario_responsable: req.usuario._id,
      bodegaOrigen,
      bodegaDestino,
      motivoMovimiento,
      observaciones,
      documentoReferencia,
    });

    // Poblar información relacionada
    await movimiento.populate([
      { path: 'producto', select: 'nombre codigo stock_actual unidadMedida' },
      { path: 'usuario_responsable', select: 'nombre email rol' },
      { path: 'bodegaOrigen', select: 'nombre direccion.ciudad' },
      { path: 'bodegaDestino', select: 'nombre direccion.ciudad' },
    ]);

    res.status(201).json({
      success: true,
      message: `Movimiento de ${tipo} registrado exitosamente. Stock actualizado: ${movimiento.stockNuevo}`,
      data: {
        movimiento,
        stockAnterior: movimiento.stockAnterior,
        stockNuevo: movimiento.stockNuevo,
        diferencia: movimiento.diferencia,
      },
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);

    // Errores específicos del modelo
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear movimiento',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener todos los movimientos
 * @route   GET /api/movimientos
 * @access  Privado
 */
export const obtenerMovimientos = async (req, res) => {
  try {
    const {
      tipo,
      producto,
      usuario,
      fechaInicio,
      fechaFin,
      page = 1,
      limit = 20,
    } = req.query;

    // Construir filtro
    const filtro = {};
    if (tipo) filtro.tipo = tipo;
    if (producto) filtro.producto = producto;
    if (usuario) filtro.usuario_responsable = usuario;

    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      filtro.fecha = {};
      if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) filtro.fecha.$lte = new Date(fechaFin);
    }

    // Paginación
    const skip = (page - 1) * limit;

    const movimientos = await Movimiento.find(filtro)
      .populate('producto', 'nombre codigo unidadMedida')
      .populate('usuario_responsable', 'nombre email rol')
      .populate('bodegaOrigen', 'nombre')
      .populate('bodegaDestino', 'nombre')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ fecha: -1 });

    const total = await Movimiento.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: {
        movimientos,
        paginacion: {
          total,
          pagina: parseInt(page),
          limite: parseInt(limit),
          totalPaginas: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener movimiento por ID
 * @route   GET /api/movimientos/:id
 * @access  Privado
 */
export const obtenerMovimientoPorId = async (req, res) => {
  try {
    const movimiento = await Movimiento.findById(req.params.id)
      .populate('producto', 'nombre codigo stock_actual unidadMedida categoria')
      .populate('usuario_responsable', 'nombre email rol')
      .populate('bodegaOrigen', 'nombre direccion')
      .populate('bodegaDestino', 'nombre direccion');

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: { movimiento },
    });
  } catch (error) {
    console.error('Error al obtener movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimiento',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener historial de movimientos de un producto
 * @route   GET /api/movimientos/producto/:productoId
 * @access  Privado
 */
export const obtenerHistorialProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { fechaInicio, fechaFin, limit = 50 } = req.query;

    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    // Usar el método estático del modelo
    const movimientos = await Movimiento.obtenerHistorialProducto(
      productoId,
      fechaInicio,
      fechaFin,
    );

    // Limitar resultados
    const movimientosLimitados = movimientos.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        producto: {
          id: producto._id,
          nombre: producto.nombre,
          codigo: producto.codigo,
          stockActual: producto.stock_actual,
        },
        movimientos: movimientosLimitados,
        total: movimientos.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener historial del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial del producto',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener resumen de movimientos por tipo
 * @route   GET /api/movimientos/reportes/resumen
 * @access  Privado (Admin/Coordinador)
 */
export const obtenerResumenMovimientos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;

    const resumen = await Movimiento.resumenPorTipo(fechaInicio, fechaFin);

    // Obtener totales
    const totalMovimientos = resumen.reduce(
      (sum, item) => sum + item.cantidad_movimientos,
      0,
    );
    const totalCantidad = resumen.reduce((sum, item) => sum + item.total, 0);

    res.status(200).json({
      success: true,
      data: {
        resumen,
        totales: {
          totalMovimientos,
          totalCantidad,
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener resumen de movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de movimientos',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener movimientos recientes
 * @route   GET /api/movimientos/recientes
 * @access  Privado
 */
export const obtenerMovimientosRecientes = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const movimientos = await Movimiento.find()
      .populate('producto', 'nombre codigo')
      .populate('usuario_responsable', 'nombre')
      .limit(parseInt(limit))
      .sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      data: {
        movimientos,
        total: movimientos.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener movimientos recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos recientes',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener movimientos por usuario
 * @route   GET /api/movimientos/usuario/:usuarioId
 * @access  Privado
 */
export const obtenerMovimientosPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { fechaInicio, fechaFin, page = 1, limit = 20 } = req.query;

    const filtro = { usuario_responsable: usuarioId };

    if (fechaInicio || fechaFin) {
      filtro.fecha = {};
      if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) filtro.fecha.$lte = new Date(fechaFin);
    }

    const skip = (page - 1) * limit;

    const movimientos = await Movimiento.find(filtro)
      .populate('producto', 'nombre codigo')
      .populate('bodegaOrigen', 'nombre')
      .populate('bodegaDestino', 'nombre')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ fecha: -1 });

    const total = await Movimiento.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: {
        movimientos,
        paginacion: {
          total,
          pagina: parseInt(page),
          limite: parseInt(limit),
          totalPaginas: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener movimientos por usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos por usuario',
      error: error.message,
    });
  }
};

export default {
  crearMovimiento,
  obtenerMovimientos,
  obtenerMovimientoPorId,
  obtenerHistorialProducto,
  obtenerResumenMovimientos,
  obtenerMovimientosRecientes,
  obtenerMovimientosPorUsuario,
};
