import mongoose from 'mongoose';

/**
 * Modelo simplificado de Entrega
 * La Entrega se crea automáticamente cuando una Ruta pasa a estado 'en_transito'
 * El conductor usa este registro para marcar el estado final de la entrega.
 *
 * IMPORTANTE: El tracking GPS está en el modelo de Ruta, no aquí.
 */

// Schema para los productos entregados
const productoEntregadoSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    cantidadProgramada: {
      type: Number,
      required: true,
      min: 1,
    },
    cantidadEntregada: {
      type: Number,
      default: 0,
      min: 0,
    },
    observacion: String,
  },
  { _id: false },
);

const entregaSchema = new mongoose.Schema(
  {
    numeroEntrega: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    ruta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ruta',
      required: [true, 'La ruta es obligatoria'],
      index: true,
    },
    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El conductor es obligatorio'],
      index: true,
    },
    vehiculo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehiculo',
      required: [true, 'El vehículo es obligatorio'],
    },
    cliente: {
      nombre: {
        type: String,
        required: [true, 'El nombre del cliente es obligatorio'],
        trim: true,
      },
      direccion: {
        type: String,
        required: [true, 'La dirección es obligatoria'],
        trim: true,
      },
      telefono: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    origen: {
      nombre: {
        type: String,
        required: true,
        trim: true,
      },
      direccion: {
        type: String,
        required: true,
        trim: true,
      },
    },
    productos: [productoEntregadoSchema],
    estado: {
      type: String,
      enum: {
        values: [
          'pendiente', // Ruta en_transito, esperando llegada
          'entregado', // Entrega completada exitosamente
          'parcial', // Entrega parcial (no todos los productos)
          'rechazado', // Cliente rechazó la entrega
          'no_encontrado', // No se encontró al cliente
          'reprogramado', // Se debe reprogramar
        ],
        message: '{VALUE} no es un estado válido',
      },
      default: 'pendiente',
      required: true,
    },
    fecha_programada: {
      type: Date,
      required: [true, 'La fecha programada es obligatoria'],
    },
    fecha_entrega: {
      type: Date,
    },
    observaciones: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres'],
    },
    motivoNoEntrega: {
      type: String,
      trim: true,
    },
    firma: {
      type: String,
    },
    fotoEntrega: {
      type: String,
    },
    calificacion: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Generar número de entrega automáticamente
entregaSchema.pre('save', async function (next) {
  if (this.isNew && !this.numeroEntrega) {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    const count = await mongoose.model('Entrega').countDocuments({
      createdAt: {
        $gte: new Date(año, fecha.getMonth(), fecha.getDate()),
        $lt: new Date(año, fecha.getMonth(), fecha.getDate() + 1),
      },
    });

    this.numeroEntrega = `ENT${año}${mes}${dia}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Índices
entregaSchema.index({ estado: 1, fecha_programada: 1 });
entregaSchema.index({ conductor: 1, estado: 1 });
entregaSchema.index({ ruta: 1 });
entregaSchema.index({ createdAt: -1 });

// Virtual para calcular progreso de entrega de productos
entregaSchema.virtual('progresoProductos').get(function () {
  if (!this.productos || this.productos.length === 0) return 0;
  const totalProgramado = this.productos.reduce(
    (sum, p) => sum + p.cantidadProgramada,
    0,
  );
  const totalEntregado = this.productos.reduce(
    (sum, p) => sum + p.cantidadEntregada,
    0,
  );
  return totalProgramado > 0
    ? Math.round((totalEntregado / totalProgramado) * 100)
    : 0;
});

// Virtual para verificar si está completada (cualquier estado final)
entregaSchema.virtual('estaCompletada').get(function () {
  return [
    'entregado',
    'parcial',
    'rechazado',
    'no_encontrado',
    'reprogramado',
  ].includes(this.estado);
});

/**
 * Marcar como entregado completamente
 * @param {Object} datos - Datos de la entrega {observaciones, firma, fotoEntrega, calificacion}
 */
entregaSchema.methods.marcarEntregado = async function (datos = {}) {
  if (this.estado !== 'pendiente') {
    throw new Error('Solo se pueden marcar entregas pendientes');
  }

  this.estado = 'entregado';
  this.fecha_entrega = new Date();

  if (datos.firma) this.firma = datos.firma;
  if (datos.fotoEntrega) this.fotoEntrega = datos.fotoEntrega;
  if (datos.observaciones) this.observaciones = datos.observaciones;
  if (datos.calificacion) this.calificacion = datos.calificacion;

  // Marcar todos los productos como entregados completamente
  this.productos.forEach((p) => {
    p.cantidadEntregada = p.cantidadProgramada;
  });

  return await this.save();
};

/**
 * Marcar como entrega parcial
 * @param {Array} productosEntregados - Array con {productoId, cantidadEntregada, observacion}
 * @param {Object} datos - Datos adicionales
 */
entregaSchema.methods.marcarParcial = async function (
  productosEntregados = [],
  datos = {},
) {
  if (this.estado !== 'pendiente') {
    throw new Error('Solo se pueden marcar entregas pendientes');
  }

  this.estado = 'parcial';
  this.fecha_entrega = new Date();

  // Actualizar cantidades entregadas por producto
  productosEntregados.forEach((pe) => {
    const producto = this.productos.find(
      (p) => p.producto.toString() === pe.productoId.toString(),
    );
    if (producto) {
      producto.cantidadEntregada = pe.cantidadEntregada;
      if (pe.observacion) producto.observacion = pe.observacion;
    }
  });

  if (datos.firma) this.firma = datos.firma;
  if (datos.fotoEntrega) this.fotoEntrega = datos.fotoEntrega;
  if (datos.observaciones) this.observaciones = datos.observaciones;

  return await this.save();
};

/**
 * Marcar como no entregado (rechazado, no encontrado, reprogramado)
 * @param {String} motivo - El motivo de no entrega
 * @param {String} nuevoEstado - El nuevo estado (rechazado, no_encontrado, reprogramado)
 * @param {Object} datos - Datos adicionales
 */
entregaSchema.methods.marcarNoEntregado = async function (
  motivo,
  nuevoEstado = 'rechazado',
  datos = {},
) {
  if (this.estado !== 'pendiente') {
    throw new Error('Solo se pueden marcar entregas pendientes');
  }

  const estadosValidos = ['rechazado', 'no_encontrado', 'reprogramado'];
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error(`Estado no válido. Use: ${estadosValidos.join(', ')}`);
  }

  this.estado = nuevoEstado;
  this.fecha_entrega = new Date();
  this.motivoNoEntrega = motivo;

  if (datos.fotoEntrega) this.fotoEntrega = datos.fotoEntrega;
  if (datos.observaciones) this.observaciones = datos.observaciones;

  return await this.save();
};

// Asegurar que los virtuals se incluyan en JSON
entregaSchema.set('toJSON', { virtuals: true });
entregaSchema.set('toObject', { virtuals: true });

const Entrega = mongoose.model('Entrega', entregaSchema);

export default Entrega;
