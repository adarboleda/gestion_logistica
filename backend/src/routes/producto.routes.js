import express from 'express';
import {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerProductosStockBajo,
  obtenerProductosPorBodega,
  obtenerResumenInventario,
  cambiarEstadoProducto,
} from '../controllers/producto.controller.js';
import { verificarAutenticacion } from '../middleware/auth.middleware.js';
import {
  verificarRol,
  esAdmin,
  esAdminOCoordinador,
  esAdminOOperador,
} from '../middleware/role.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarAutenticacion);

/**
 * @route   GET /api/productos
 * @desc    Obtener todos los productos con filtros y paginación
 * @access  Privado (todos los roles autenticados)
 * @query   bodega, categoria, activo, stockBajo, buscar, page, limit
 */
router.get('/', obtenerProductos);

/**
 * @route   GET /api/productos/alertas/stock-bajo
 * @desc    Obtener productos con stock por debajo del mínimo
 * @access  Privado (Admin, Coordinador, Operador)
 * @query   bodega
 */
router.get(
  '/alertas/stock-bajo',
  esAdminOCoordinador,
  obtenerProductosStockBajo,
);

/**
 * @route   GET /api/productos/reportes/resumen
 * @desc    Obtener resumen del inventario (estadísticas)
 * @access  Privado (Admin, Coordinador)
 * @query   bodega
 */
router.get('/reportes/resumen', esAdminOCoordinador, obtenerResumenInventario);

/**
 * @route   GET /api/productos/bodega/:bodegaId
 * @desc    Obtener todos los productos de una bodega específica
 * @access  Privado (todos los roles autenticados)
 * @param   bodegaId
 */
router.get('/bodega/:bodegaId', obtenerProductosPorBodega);

/**
 * @route   GET /api/productos/:id
 * @desc    Obtener un producto por ID
 * @access  Privado (todos los roles autenticados)
 * @param   id
 */
router.get('/:id', obtenerProductoPorId);

/**
 * @route   POST /api/productos
 * @desc    Crear un nuevo producto
 * @access  Privado (Admin, Operador)
 * @body    nombre, codigo, descripcion, categoria, stock_actual, stock_minimo, unidadMedida, precio, imagen, bodega
 */
router.post('/', esAdminOOperador, crearProducto);

/**
 * @route   PUT /api/productos/:id
 * @desc    Actualizar un producto
 * @access  Privado (Admin, Operador)
 * @param   id
 * @body    nombre, descripcion, categoria, stock_minimo, unidadMedida, precio, imagen, bodega, activo
 */
router.put('/:id', esAdminOOperador, actualizarProducto);

/**
 * @route   PATCH /api/productos/:id/estado
 * @desc    Cambiar el estado activo/inactivo de un producto
 * @access  Privado (Admin)
 * @param   id
 * @body    activo
 */
router.patch('/:id/estado', esAdmin, cambiarEstadoProducto);

/**
 * @route   DELETE /api/productos/:id
 * @desc    Eliminar (desactivar) un producto
 * @access  Privado (Admin)
 * @param   id
 */
router.delete('/:id', esAdmin, eliminarProducto);

export default router;
