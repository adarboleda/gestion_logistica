import Bodega from '../models/Bodega.js';

/**
 * @desc    Obtener todas las bodegas con paginación y filtros
 * @route   GET /api/bodegas
 * @access  Private (Autenticado)
 */
export const obtenerBodegas = async (req, res) => {
  try {
    const { page = 1, limit = 10, activo, ciudad, search } = req.query;

    // Construir filtros
    const filtros = {};

    if (activo !== undefined) {
      filtros.activo = activo === 'true';
    }

    if (ciudad) {
      filtros.ciudad = { $regex: ciudad, $options: 'i' };
    }

    if (search) {
      filtros.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { codigo: { $regex: search, $options: 'i' } },
        { direccion: { $regex: search, $options: 'i' } },
      ];
    }

    // Ejecutar consulta con paginación
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
    };

    const bodegas = await Bodega.find(filtros)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await Bodega.countDocuments(filtros);

    res.status(200).json({
      success: true,
      message: 'Bodegas obtenidas exitosamente',
      data: {
        bodegas,
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
      message: 'Error al obtener las bodegas',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener bodega por ID
 * @route   GET /api/bodegas/:id
 * @access  Private
 */
export const obtenerBodegaPorId = async (req, res) => {
  try {
    const bodega = await Bodega.findById(req.params.id);

    if (!bodega) {
      return res.status(404).json({
        success: false,
        message: 'Bodega no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bodega obtenida exitosamente',
      data: { bodega },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la bodega',
      error: error.message,
    });
  }
};

/**
 * @desc    Crear nueva bodega
 * @route   POST /api/bodegas
 * @access  Private (Admin/Coordinador)
 */
export const crearBodega = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      direccion,
      ciudad,
      capacidad_m3,
      telefono,
      responsable,
    } = req.body;

    // Validar que no exista una bodega con el mismo código
    const bodegaExistente = await Bodega.findOne({ codigo });
    if (bodegaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una bodega con ese código',
      });
    }

    const bodega = await Bodega.create({
      codigo,
      nombre,
      direccion,
      ciudad,
      capacidad_m3,
      telefono,
      responsable,
    });

    res.status(201).json({
      success: true,
      message: 'Bodega creada exitosamente',
      data: { bodega },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear la bodega',
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar bodega
 * @route   PUT /api/bodegas/:id
 * @access  Private (Admin/Coordinador)
 */
export const actualizarBodega = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      direccion,
      ciudad,
      capacidad_m3,
      telefono,
      responsable,
    } = req.body;

    // Verificar que la bodega existe
    let bodega = await Bodega.findById(req.params.id);
    if (!bodega) {
      return res.status(404).json({
        success: false,
        message: 'Bodega no encontrada',
      });
    }

    // Si se está cambiando el código, verificar que no exista
    if (codigo && codigo !== bodega.codigo) {
      const bodegaExistente = await Bodega.findOne({ codigo });
      if (bodegaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una bodega con ese código',
        });
      }
    }

    // Actualizar campos
    bodega = await Bodega.findByIdAndUpdate(
      req.params.id,
      {
        codigo,
        nombre,
        direccion,
        ciudad,
        capacidad_m3,
        telefono,
        responsable,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      success: true,
      message: 'Bodega actualizada exitosamente',
      data: { bodega },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la bodega',
      error: error.message,
    });
  }
};

/**
 * @desc    Cambiar estado de bodega (activo/inactivo)
 * @route   PATCH /api/bodegas/:id/estado
 * @access  Private (Admin)
 */
export const cambiarEstadoBodega = async (req, res) => {
  try {
    const bodega = await Bodega.findById(req.params.id);

    if (!bodega) {
      return res.status(404).json({
        success: false,
        message: 'Bodega no encontrada',
      });
    }

    bodega.activo = !bodega.activo;
    await bodega.save();

    res.status(200).json({
      success: true,
      message: `Bodega ${bodega.activo ? 'activada' : 'desactivada'} exitosamente`,
      data: { bodega },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar el estado de la bodega',
      error: error.message,
    });
  }
};

/**
 * @desc    Eliminar bodega
 * @route   DELETE /api/bodegas/:id
 * @access  Private (Admin)
 */
export const eliminarBodega = async (req, res) => {
  try {
    const bodega = await Bodega.findById(req.params.id);

    if (!bodega) {
      return res.status(404).json({
        success: false,
        message: 'Bodega no encontrada',
      });
    }

    // Verificar si hay productos asociados a esta bodega
    const Producto = (await import('../models/Producto.js')).default;
    const productosAsociados = await Producto.countDocuments({
      bodega_principal: req.params.id,
    });

    if (productosAsociados > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la bodega porque tiene ${productosAsociados} producto(s) asociado(s)`,
      });
    }

    await bodega.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Bodega eliminada exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la bodega',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener estadísticas de bodega
 * @route   GET /api/bodegas/:id/estadisticas
 * @access  Private
 */
export const obtenerEstadisticasBodega = async (req, res) => {
  try {
    const bodega = await Bodega.findById(req.params.id);

    if (!bodega) {
      return res.status(404).json({
        success: false,
        message: 'Bodega no encontrada',
      });
    }

    const Producto = (await import('../models/Producto.js')).default;

    // Contar productos en esta bodega
    const totalProductos = await Producto.countDocuments({
      bodega_principal: req.params.id,
      activo: true,
    });

    // Obtener valor total del inventario
    const productos = await Producto.find({
      bodega_principal: req.params.id,
      activo: true,
    });

    const valorTotal = productos.reduce((sum, p) => {
      return sum + p.precio_compra * p.stock_actual;
    }, 0);

    const stockTotal = productos.reduce((sum, p) => {
      return sum + p.stock_actual;
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        bodega: {
          _id: bodega._id,
          nombre: bodega.nombre,
          codigo: bodega.codigo,
        },
        estadisticas: {
          total_productos: totalProductos,
          stock_total_unidades: stockTotal,
          valor_total_inventario: valorTotal,
          capacidad_m3: bodega.capacidad_m3,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
};
