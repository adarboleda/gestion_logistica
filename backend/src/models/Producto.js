import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [150, 'El nombre no puede exceder 150 caracteres'],
    },
    codigo: {
      type: String,
      required: [true, 'El código del producto es obligatorio'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9-]+$/,
        'El código solo puede contener letras mayúsculas, números y guiones',
      ],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    categoria: {
      type: String,
      trim: true,
      enum: {
        values: [
          'Electrónica',
          'Alimentos',
          'Textil',
          'Farmacéutico',
          'Industrial',
          'Otro',
        ],
        message: '{VALUE} no es una categoría válida',
      },
      default: 'Otro',
    },
    stock_actual: {
      type: Number,
      required: [true, 'El stock actual es obligatorio'],
      min: [0, 'El stock no puede ser negativo'],
      default: 0,
    },
    stock_minimo: {
      type: Number,
      required: [true, 'El stock mínimo es obligatorio'],
      min: [0, 'El stock mínimo no puede ser negativo'],
      default: 10,
    },
    precio: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
      default: 0,
    },
    imagen: {
      type: String,
      trim: true,
      default: '',
    },
    bodega: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bodega',
      required: [true, 'La bodega es obligatoria'],
      index: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índices compuestos para mejorar búsquedas
// codigo ya tiene índice automático por unique: true
productoSchema.index({ bodega: 1, activo: 1 });
productoSchema.index({ nombre: 'text', descripcion: 'text' }); // Búsqueda de texto

// Virtual para verificar si el stock está bajo
productoSchema.virtual('stockBajo').get(function () {
  return this.stock_actual <= this.stock_minimo;
});

// Virtual para calcular valor total del inventario
productoSchema.virtual('valorInventario').get(function () {
  return this.stock_actual * this.precio;
});

// Middleware pre-save: Validar que stock_actual no sea menor que 0
productoSchema.pre('save', function (next) {
  if (this.stock_actual < 0) {
    next(new Error('El stock actual no puede ser negativo'));
  }
  next();
});

// Método para verificar disponibilidad
productoSchema.methods.verificarDisponibilidad = function (cantidad) {
  return this.stock_actual >= cantidad;
};

// Método para ajustar stock
productoSchema.methods.ajustarStock = async function (cantidad, tipo) {
  if (tipo === 'entrada') {
    this.stock_actual += cantidad;
  } else if (tipo === 'salida' || tipo === 'transferencia') {
    if (this.stock_actual < cantidad) {
      throw new Error('Stock insuficiente para realizar la operación');
    }
    this.stock_actual -= cantidad;
  }
  return await this.save();
};

// Asegurar que los virtuals se incluyan en JSON
productoSchema.set('toJSON', { virtuals: true });
productoSchema.set('toObject', { virtuals: true });

const Producto = mongoose.model('Producto', productoSchema);

export default Producto;
