import Producto from '../models/Producto.js';
import Bodega from '../models/Bodega.js';

/**
 * @desc    Obtener todos los productos
 * @route   GET /api/productos
 * @access  Privado
 */
export const obtenerProductos = async (req, res) => {
  try {
    const {
      bodega,
      categoria,
      activo,
      stockBajo,
      buscar,
      page = 1,
      limit = 10,
    } = req.query;

    // Construir filtro
    const filtro = {};
    if (bodega) filtro.bodega = bodega;
    if (categoria) filtro.categoria = categoria;
    if (activo !== undefined) filtro.activo = activo === 'true';

    // Búsqueda de texto
    if (buscar) {
      filtro.$or = [
        { nombre: { $regex: buscar, $options: 'i' } },
        { codigo: { $regex: buscar, $options: 'i' } },
        { descripcion: { $regex: buscar, $options: 'i' } },
      ];
    }

    // Paginación
    const skip = (page - 1) * limit;

    // Obtener productos
    let productos = await Producto.find(filtro)
      .populate('bodega', 'nombre direccion.ciudad estado')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ nombre: 1 });

    // Filtrar por stock bajo si se solicita
    if (stockBajo === 'true') {
      productos = productos.filter((p) => p.stockBajo);
    }

    // Contar total
    const total = await Producto.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: {
        productos,
        paginacion: {
          total,
          pagina: parseInt(page),
          limite: parseInt(limit),
          totalPaginas: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener producto por ID
 * @route   GET /api/productos/:id
 * @access  Privado
 */
export const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate(
      'bodega',
      'nombre direccion estado capacidadMaxima',
    );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      data: { producto },
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message,
    });
  }
};

/**
 * @desc    Crear nuevo producto
 * @route   POST /api/productos
 * @access  Privado (Admin/Operador)
 */
export const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      codigo,
      descripcion,
      categoria,
      stock_actual,
      stock_minimo,
      precio,
      imagen,
      bodega,
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !codigo || !bodega) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione nombre, código y bodega',
      });
    }

    // Verificar que el código no exista
    const productoExiste = await Producto.findOne({
      codigo: codigo.toUpperCase(),
    });
    if (productoExiste) {
      return res.status(400).json({
        success: false,
        message: `Ya existe un producto con el código ${codigo.toUpperCase()}`,
      });
    }

    // Verificar que la bodega exista
    const bodegaExiste = await Bodega.findById(bodega);
    if (!bodegaExiste) {
      return res.status(404).json({
        success: false,
        message: 'Bodega no encontrada',
      });
    }

    if (bodegaExiste.estado !== 'activa') {
      return res.status(400).json({
        success: false,
        message: 'La bodega no está activa',
      });
    }

    // Crear producto
    const producto = await Producto.create({
      nombre,
      codigo: codigo.toUpperCase(),
      descripcion,
      categoria,
      stock_actual: stock_actual || 0,
      stock_minimo: stock_minimo || 10,
      precio: precio || 0,
      imagen,
      bodega,
    });

    // Poblar información de bodega
    await producto.populate('bodega', 'nombre direccion.ciudad');

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { producto },
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message,
    });
  }
};

/**
 * @desc    Actualizar producto
 * @route   PUT /api/productos/:id
 * @access  Privado (Admin/Operador)
 */
export const actualizarProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      categoria,
      stock_minimo,
      precio,
      imagen,
      bodega,
      activo,
    } = req.body;

    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    // Verificar bodega si se está actualizando
    if (bodega && bodega !== producto.bodega.toString()) {
      const bodegaExiste = await Bodega.findById(bodega);
      if (!bodegaExiste) {
        return res.status(404).json({
          success: false,
          message: 'Bodega no encontrada',
        });
      }
      if (bodegaExiste.estado !== 'activa') {
        return res.status(400).json({
          success: false,
          message: 'La bodega no está activa',
        });
      }
      producto.bodega = bodega;
    }

    // Actualizar campos
    if (nombre) producto.nombre = nombre;
    if (descripcion !== undefined) producto.descripcion = descripcion;
    if (categoria) producto.categoria = categoria;
    if (stock_minimo !== undefined) producto.stock_minimo = stock_minimo;
    if (precio !== undefined) producto.precio = precio;
    if (imagen) producto.imagen = imagen;
    if (activo !== undefined) producto.activo = activo;

    // NOTA: El stock_actual NO se actualiza directamente aquí
    // Se actualiza a través de movimientos de inventario

    await producto.save();
    await producto.populate('bodega', 'nombre direccion.ciudad');

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { producto },
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message,
    });
  }
};

/**
 * @desc    Eliminar producto (soft delete)
 * @route   DELETE /api/productos/:id
 * @access  Privado (Admin)
 */
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    // Soft delete
    producto.activo = false;
    await producto.save();

    res.status(200).json({
      success: true,
      message: 'Producto desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener productos con stock bajo
 * @route   GET /api/productos/alertas/stock-bajo
 * @access  Privado (Admin/Operador/Coordinador)
 */
export const obtenerProductosStockBajo = async (req, res) => {
  try {
    const { bodega } = req.query;

    const filtro = { activo: true };
    if (bodega) filtro.bodega = bodega;

    const productos = await Producto.find(filtro)
      .populate('bodega', 'nombre direccion.ciudad')
      .sort({ stock_actual: 1 });

    // Filtrar productos con stock bajo
    const productosStockBajo = productos.filter((p) => p.stockBajo);

    res.status(200).json({
      success: true,
      data: {
        productos: productosStockBajo,
        total: productosStockBajo.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener productos con stock bajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos con stock bajo',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener productos por bodega
 * @route   GET /api/productos/bodega/:bodegaId
 * @access  Privado
 */
export const obtenerProductosPorBodega = async (req, res) => {
  try {
    const { bodegaId } = req.params;
    const { activo = 'true' } = req.query;

    // Verificar que la bodega existe
    const bodega = await Bodega.findById(bodegaId);
    if (!bodega) {
      return res.status(404).json({
        success: false,
        message: 'Bodega no encontrada',
      });
    }

    const filtro = { bodega: bodegaId };
    if (activo !== undefined) filtro.activo = activo === 'true';

    const productos = await Producto.find(filtro).sort({ nombre: 1 });

    res.status(200).json({
      success: true,
      data: {
        bodega: {
          id: bodega._id,
          nombre: bodega.nombre,
          ciudad: bodega.direccion.ciudad,
        },
        productos,
        total: productos.length,
      },
    });
  } catch (error) {
    console.error('Error al obtener productos por bodega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos por bodega',
      error: error.message,
    });
  }
};

/**
 * @desc    Obtener resumen de inventario
 * @route   GET /api/productos/reportes/resumen
 * @access  Privado (Admin/Coordinador)
 */
export const obtenerResumenInventario = async (req, res) => {
  try {
    const { bodega } = req.query;

    const filtro = { activo: true };
    if (bodega) filtro.bodega = bodega;

    const productos = await Producto.find(filtro);

    // Calcular estadísticas
    const totalProductos = productos.length;
    const valorTotalInventario = productos.reduce(
      (sum, p) => sum + p.stock_actual * p.precio,
      0,
    );
    const productosStockBajo = productos.filter((p) => p.stockBajo).length;
    const productosSinStock = productos.filter(
      (p) => p.stock_actual === 0,
    ).length;

    // Agrupar por categoría
    const porCategoria = productos.reduce((acc, p) => {
      if (!acc[p.categoria]) {
        acc[p.categoria] = {
          cantidad: 0,
          valor: 0,
        };
      }
      acc[p.categoria].cantidad += 1;
      acc[p.categoria].valor += p.stock_actual * p.precio;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        resumen: {
          totalProductos,
          valorTotalInventario,
          productosStockBajo,
          productosSinStock,
        },
        porCategoria,
      },
    });
  } catch (error) {
    console.error('Error al obtener resumen de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de inventario',
      error: error.message,
    });
  }
};

/**
 * @desc    Cambiar estado de producto
 * @route   PATCH /api/productos/:id/estado
 * @access  Privado (Admin)
 */
export const cambiarEstadoProducto = async (req, res) => {
  try {
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione el estado (activo: true/false)',
      });
    }

    const producto = await Producto.findById(req.params.id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
    }

    producto.activo = activo;
    await producto.save();

    res.status(200).json({
      success: true,
      message: `Producto ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: { producto },
    });
  } catch (error) {
    console.error('Error al cambiar estado de producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de producto',
      error: error.message,
    });
  }
};

export default {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerProductosStockBajo,
  obtenerProductosPorBodega,
  obtenerResumenInventario,
  cambiarEstadoProducto,
};
