import mongoose from 'mongoose';
import Producto from './Producto.js';

const movimientoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: {
        values: ['entrada', 'salida', 'transferencia'],
        message: '{VALUE} no es un tipo de movimiento válido',
      },
      required: [true, 'El tipo de movimiento es obligatorio'],
    },
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: [true, 'El producto es obligatorio'],
      index: true,
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser mayor a 0'],
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true,
    },
    usuario_responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El usuario responsable es obligatorio'],
      index: true,
    },
    bodegaOrigen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bodega',
      required: function () {
        // Obligatorio solo para transferencias
        return this.tipo === 'transferencia';
      },
    },
    bodegaDestino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bodega',
      required: function () {
        // Obligatorio solo para transferencias
        return this.tipo === 'transferencia';
      },
    },
    motivoMovimiento: {
      type: String,
      enum: {
        values: [
          'compra',
          'devolucion',
          'ajuste_inventario',
          'venta',
          'daño',
          'vencimiento',
          'transferencia_bodegas',
          'otro',
        ],
        message: '{VALUE} no es un motivo válido',
      },
      required: true,
    },
    observaciones: {
      type: String,
      trim: true,
      maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres'],
    },
    documentoReferencia: {
      type: String,
      trim: true,
      maxlength: [
        100,
        'El documento de referencia no puede exceder 100 caracteres',
      ],
    },
    stockAnterior: {
      type: Number,
      // Se asigna automáticamente en el middleware pre-save
    },
    stockNuevo: {
      type: Number,
      // Se asigna automáticamente en el middleware pre-save
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índices compuestos para optimizar consultas
movimientoSchema.index({ fecha: -1 });
movimientoSchema.index({ producto: 1, fecha: -1 });
movimientoSchema.index({ usuario_responsable: 1, fecha: -1 });
movimientoSchema.index({ tipo: 1, fecha: -1 });

// Validación personalizada para transferencias
movimientoSchema.pre('validate', function (next) {
  if (this.tipo === 'transferencia') {
    if (!this.bodegaOrigen || !this.bodegaDestino) {
      return next(
        new Error('Las transferencias requieren bodega de origen y destino'),
      );
    }
    if (this.bodegaOrigen.toString() === this.bodegaDestino.toString()) {
      return next(
        new Error('La bodega de origen y destino no pueden ser la misma'),
      );
    }
  }
  next();
});

// Middleware pre-save: Actualizar stock del producto automáticamente
movimientoSchema.pre('save', async function (next) {
  try {
    // Solo ejecutar en nuevos movimientos, no en actualizaciones
    if (this.isNew) {
      const producto = await Producto.findById(this.producto);

      if (!producto) {
        throw new Error('Producto no encontrado');
      }

      // Guardar stock anterior
      this.stockAnterior = producto.stock_actual;

      // Calcular nuevo stock según el tipo de movimiento
      let nuevoStock = producto.stock_actual;

      switch (this.tipo) {
        case 'entrada':
          nuevoStock += this.cantidad;
          break;
        case 'salida':
        case 'transferencia':
          nuevoStock -= this.cantidad;
          if (nuevoStock < 0) {
            throw new Error(
              `Stock insuficiente. Stock actual: ${producto.stock_actual}, Cantidad solicitada: ${this.cantidad}`,
            );
          }
          break;
      }

      // Actualizar stock del producto
      producto.stock_actual = nuevoStock;
      await producto.save();

      // Guardar stock nuevo en el movimiento
      this.stockNuevo = nuevoStock;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Virtual para calcular la diferencia de stock
movimientoSchema.virtual('diferencia').get(function () {
  return this.stockNuevo - this.stockAnterior;
});

// Método estático para obtener historial de un producto
movimientoSchema.statics.obtenerHistorialProducto = function (
  productoId,
  fechaInicio,
  fechaFin,
) {
  const filtro = { producto: productoId };

  if (fechaInicio || fechaFin) {
    filtro.fecha = {};
    if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
    if (fechaFin) filtro.fecha.$lte = new Date(fechaFin);
  }

  return this.find(filtro)
    .populate('usuario_responsable', 'nombre email')
    .populate('producto', 'nombre codigo')
    .populate('bodegaOrigen', 'nombre')
    .populate('bodegaDestino', 'nombre')
    .sort({ fecha: -1 });
};

// Método estático para obtener resumen de movimientos por tipo
movimientoSchema.statics.resumenPorTipo = function (fechaInicio, fechaFin) {
  const filtro = {};

  if (fechaInicio || fechaFin) {
    filtro.fecha = {};
    if (fechaInicio) filtro.fecha.$gte = new Date(fechaInicio);
    if (fechaFin) filtro.fecha.$lte = new Date(fechaFin);
  }

  return this.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: '$tipo',
        total: { $sum: '$cantidad' },
        cantidad_movimientos: { $sum: 1 },
      },
    },
  ]);
};

// Asegurar que los virtuals se incluyan en JSON
movimientoSchema.set('toJSON', { virtuals: true });
movimientoSchema.set('toObject', { virtuals: true });

const Movimiento = mongoose.model('Movimiento', movimientoSchema);

export default Movimiento;
