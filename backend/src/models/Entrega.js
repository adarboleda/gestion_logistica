import mongoose from 'mongoose';

// Schema para el tracking de ubicación simulado
const ubicacionTrackingSchema = new mongoose.Schema(
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
    nombreUbicacion: {
      type: String,
      trim: true,
    },
    velocidad: {
      type: Number,
      min: 0,
      default: 0,
    },
    porcentajeRecorrido: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false },
);

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
      coordenadas: {
        latitud: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitud: {
          type: Number,
          min: -180,
          max: 180,
        },
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
      coordenadas: {
        latitud: {
          type: Number,
          min: -90,
          max: 90,
        },
        longitud: {
          type: Number,
          min: -180,
          max: 180,
        },
      },
    },
    productos: [productoEntregadoSchema],
    estado: {
      type: String,
      enum: {
        values: [
          'pendiente',
          'en_proceso',
          'entregado',
          'retrasado',
          'cancelado',
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
    fecha_inicio: {
      type: Date,
    },
    fecha_entrega: {
      type: Date,
    },
    tracking: [ubicacionTrackingSchema],
    trackingActivo: {
      type: Boolean,
      default: false,
    },
    ubicacionActual: {
      latitud: Number,
      longitud: Number,
      nombreUbicacion: String,
      ultimaActualizacion: Date,
    },
    tiempoEstimadoLlegada: {
      type: Number, // en minutos
      min: 0,
    },
    distanciaTotal: {
      type: Number, // en km
      min: 0,
    },
    distanciaRecorrida: {
      type: Number,
      default: 0,
      min: 0,
    },
    observaciones: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres'],
    },
    motivoRetraso: {
      type: String,
      trim: true,
    },
    firma: {
      type: String, // URL o base64 de la firma digital
    },
    fotoEntrega: {
      type: String, // URL de la foto de entrega
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
entregaSchema.index({ fecha_programada: -1 });
entregaSchema.index({ createdAt: -1 });

// Virtual para verificar si está retrasada
entregaSchema.virtual('estaRetrasada').get(function () {
  if (this.estado === 'entregado' || this.estado === 'cancelado') return false;
  const ahora = new Date();
  return this.fecha_programada < ahora && this.estado !== 'entregado';
});

// Virtual para calcular progreso de entrega
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

// Método para iniciar entrega
entregaSchema.methods.iniciarEntrega = async function () {
  if (this.estado !== 'pendiente') {
    throw new Error('Solo se pueden iniciar entregas pendientes');
  }
  this.estado = 'en_proceso';
  this.fecha_inicio = new Date();
  this.trackingActivo = true;
  return await this.save();
};

// Método para marcar como entregado
entregaSchema.methods.completarEntrega = async function (datosEntrega = {}) {
  if (this.estado !== 'en_proceso' && this.estado !== 'retrasado') {
    throw new Error(
      'Solo se pueden completar entregas en proceso o retrasadas',
    );
  }

  this.estado = 'entregado';
  this.fecha_entrega = new Date();
  this.trackingActivo = false;

  if (datosEntrega.firma) this.firma = datosEntrega.firma;
  if (datosEntrega.fotoEntrega) this.fotoEntrega = datosEntrega.fotoEntrega;
  if (datosEntrega.observaciones)
    this.observaciones = datosEntrega.observaciones;
  if (datosEntrega.calificacion) this.calificacion = datosEntrega.calificacion;

  // Marcar todos los productos como entregados si no se especificó
  this.productos.forEach((p) => {
    if (p.cantidadEntregada === 0) {
      p.cantidadEntregada = p.cantidadProgramada;
    }
  });

  return await this.save();
};

// Método para marcar como retrasado
entregaSchema.methods.marcarRetrasado = async function (motivo) {
  if (this.estado === 'entregado' || this.estado === 'cancelado') {
    throw new Error('No se puede marcar como retrasada una entrega finalizada');
  }
  this.estado = 'retrasado';
  this.motivoRetraso = motivo;
  return await this.save();
};

// Método para agregar punto de tracking
entregaSchema.methods.agregarPuntoTracking = async function (datos) {
  this.tracking.push({
    latitud: datos.latitud,
    longitud: datos.longitud,
    nombreUbicacion: datos.nombreUbicacion,
    velocidad: datos.velocidad || 0,
    porcentajeRecorrido: datos.porcentajeRecorrido || 0,
  });

  this.ubicacionActual = {
    latitud: datos.latitud,
    longitud: datos.longitud,
    nombreUbicacion: datos.nombreUbicacion,
    ultimaActualizacion: new Date(),
  };

  if (datos.distanciaRecorrida) {
    this.distanciaRecorrida = datos.distanciaRecorrida;
  }

  return await this.save();
};

// Asegurar que los virtuals se incluyan en JSON
entregaSchema.set('toJSON', { virtuals: true });
entregaSchema.set('toObject', { virtuals: true });

const Entrega = mongoose.model('Entrega', entregaSchema);

export default Entrega;
