import mongoose from 'mongoose';

const productoRutaSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: [1, 'La cantidad debe ser mayor a 0'],
    },
    entregado: {
      type: Number,
      default: 0,
      min: [0, 'La cantidad entregada no puede ser negativa'],
    },
  },
  { _id: false },
);

const trackingSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      default: Date.now,
    },
    latitud: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    longitud: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
    velocidad: {
      type: Number,
      min: 0,
      default: 0,
    },
    observacion: String,
  },
  { _id: false },
);

const rutaSchema = new mongoose.Schema(
  {
    numeroRuta: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    origen: {
      nombre: {
        type: String,
        required: [true, 'El nombre del origen es obligatorio'],
        trim: true,
      },
      direccion: {
        type: String,
        required: [true, 'La dirección del origen es obligatoria'],
        trim: true,
      },
      coordenadas: {
        latitud: {
          type: Number,
          required: true,
          min: -90,
          max: 90,
        },
        longitud: {
          type: Number,
          required: true,
          min: -180,
          max: 180,
        },
      },
    },
    destino: {
      nombre: {
        type: String,
        required: [true, 'El nombre del destino es obligatorio'],
        trim: true,
      },
      direccion: {
        type: String,
        required: [true, 'La dirección del destino es obligatoria'],
        trim: true,
      },
      coordenadas: {
        latitud: {
          type: Number,
          required: true,
          min: -90,
          max: 90,
        },
        longitud: {
          type: Number,
          required: true,
          min: -180,
          max: 180,
        },
      },
      contacto: {
        nombre: String,
        telefono: String,
        email: String,
      },
    },
    fecha_programada: {
      type: Date,
      required: [true, 'La fecha programada es obligatoria'],
      validate: {
        validator: function (fecha) {
          // La fecha programada no puede ser en el pasado (solo para nuevas rutas)
          if (this.isNew) {
            return fecha >= new Date();
          }
          return true;
        },
        message: 'La fecha programada no puede ser en el pasado',
      },
    },
    fecha_inicio_real: {
      type: Date,
    },
    fecha_fin_real: {
      type: Date,
    },
    vehiculo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehiculo',
      required: [true, 'El vehículo es obligatorio'],
      index: true,
    },
    conductor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El conductor es obligatorio'],
      index: true,
      validate: {
        validator: async function (conductorId) {
          const Usuario = mongoose.model('Usuario');
          const conductor = await Usuario.findById(conductorId);
          return conductor && conductor.rol === 'conductor';
        },
        message: 'El usuario debe tener rol de conductor',
      },
    },
    lista_productos: {
      type: [productoRutaSchema],
      validate: {
        validator: function (lista) {
          return lista && lista.length > 0;
        },
        message: 'Debe incluir al menos un producto en la ruta',
      },
    },
    estado: {
      type: String,
      enum: {
        values: ['planificada', 'en_transito', 'completada', 'cancelada'],
        message: '{VALUE} no es un estado válido',
      },
      default: 'planificada',
      required: true,
    },
    prioridad: {
      type: String,
      enum: {
        values: ['baja', 'media', 'alta', 'urgente'],
        message: '{VALUE} no es una prioridad válida',
      },
      default: 'media',
    },
    distancia_km: {
      type: Number,
      min: [0, 'La distancia debe ser un número positivo'],
    },
    tiempo_estimado_horas: {
      type: Number,
      min: [0, 'El tiempo estimado debe ser un número positivo'],
    },
    tracking: [trackingSchema],
    observaciones: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres'],
    },
    motivo_cancelacion: {
      type: String,
      trim: true,
      required: function () {
        return this.estado === 'cancelada';
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Generar número de ruta automáticamente
rutaSchema.pre('save', async function (next) {
  if (this.isNew && !this.numeroRuta) {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');

    // Contar rutas del mes actual
    const count = await mongoose.model('Ruta').countDocuments({
      createdAt: {
        $gte: new Date(año, fecha.getMonth(), 1),
        $lt: new Date(año, fecha.getMonth() + 1, 1),
      },
    });

    this.numeroRuta = `R${año}${mes}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Índices compuestos
rutaSchema.index({ numeroRuta: 1 });
rutaSchema.index({ estado: 1, fecha_programada: 1 });
rutaSchema.index({ conductor: 1, estado: 1 });
rutaSchema.index({ vehiculo: 1, estado: 1 });
rutaSchema.index({ fecha_programada: -1 });

// Virtual para calcular progreso de entrega
rutaSchema.virtual('progresoEntrega').get(function () {
  if (!this.lista_productos || this.lista_productos.length === 0) return 0;

  const totalProductos = this.lista_productos.reduce(
    (sum, item) => sum + item.cantidad,
    0,
  );
  const totalEntregado = this.lista_productos.reduce(
    (sum, item) => sum + item.entregado,
    0,
  );

  return totalProductos > 0
    ? Math.round((totalEntregado / totalProductos) * 100)
    : 0;
});

// Virtual para verificar si está retrasada
rutaSchema.virtual('estaRetrasada').get(function () {
  if (this.estado === 'completada' || this.estado === 'cancelada') return false;

  const ahora = new Date();
  return this.fecha_programada < ahora && this.estado !== 'completada';
});

// Virtual para calcular duración real
rutaSchema.virtual('duracionReal').get(function () {
  if (!this.fecha_inicio_real || !this.fecha_fin_real) return null;

  const diff = this.fecha_fin_real - this.fecha_inicio_real;
  return Math.round(diff / (1000 * 60 * 60 * 100)) / 100; // Horas con 2 decimales
});

// Método para iniciar ruta
rutaSchema.methods.iniciarRuta = async function () {
  if (this.estado !== 'planificada') {
    throw new Error('Solo se pueden iniciar rutas en estado planificada');
  }

  const Vehiculo = mongoose.model('Vehiculo');
  const vehiculo = await Vehiculo.findById(this.vehiculo);

  if (!vehiculo) {
    throw new Error('Vehículo no encontrado');
  }

  if (!vehiculo.estaDisponible()) {
    throw new Error('El vehículo no está disponible');
  }

  this.estado = 'en_transito';
  this.fecha_inicio_real = new Date();

  // Actualizar estado del vehículo
  vehiculo.estado = 'en_ruta';
  await vehiculo.save();

  return await this.save();
};

// Método para completar ruta
rutaSchema.methods.completarRuta = async function () {
  if (this.estado !== 'en_transito') {
    throw new Error('Solo se pueden completar rutas en tránsito');
  }

  this.estado = 'completada';
  this.fecha_fin_real = new Date();

  // Liberar vehículo
  const Vehiculo = mongoose.model('Vehiculo');
  const vehiculo = await Vehiculo.findById(this.vehiculo);
  if (vehiculo) {
    vehiculo.estado = 'disponible';
    await vehiculo.save();
  }

  return await this.save();
};

// Método para cancelar ruta
rutaSchema.methods.cancelarRuta = async function (motivo) {
  if (this.estado === 'completada') {
    throw new Error('No se puede cancelar una ruta completada');
  }

  this.estado = 'cancelada';
  this.motivo_cancelacion = motivo;

  // Liberar vehículo si estaba en ruta
  if (this.estado === 'en_transito') {
    const Vehiculo = mongoose.model('Vehiculo');
    const vehiculo = await Vehiculo.findById(this.vehiculo);
    if (vehiculo) {
      vehiculo.estado = 'disponible';
      await vehiculo.save();
    }
  }

  return await this.save();
};

// Método para agregar punto de tracking
rutaSchema.methods.agregarTracking = async function (
  latitud,
  longitud,
  velocidad,
  observacion,
) {
  this.tracking.push({
    latitud,
    longitud,
    velocidad: velocidad || 0,
    observacion,
  });
  return await this.save();
};

// Método para actualizar entrega de producto
rutaSchema.methods.actualizarEntrega = async function (
  productoId,
  cantidadEntregada,
) {
  const productoEnRuta = this.lista_productos.find(
    (item) => item.producto.toString() === productoId.toString(),
  );

  if (!productoEnRuta) {
    throw new Error('Producto no encontrado en la ruta');
  }

  if (cantidadEntregada > productoEnRuta.cantidad) {
    throw new Error(
      'La cantidad entregada no puede ser mayor a la cantidad asignada',
    );
  }

  productoEnRuta.entregado = cantidadEntregada;
  return await this.save();
};

// Método estático para obtener rutas activas de un conductor
rutaSchema.statics.obtenerRutasActivas = function (conductorId) {
  return this.find({
    conductor: conductorId,
    estado: { $in: ['planificada', 'en_transito'] },
  })
    .populate('vehiculo', 'placa marca modelo')
    .populate('lista_productos.producto', 'nombre codigo')
    .sort({ fecha_programada: 1 });
};

// Asegurar que los virtuals se incluyan en JSON
rutaSchema.set('toJSON', { virtuals: true });
rutaSchema.set('toObject', { virtuals: true });

const Ruta = mongoose.model('Ruta', rutaSchema);

export default Ruta;
