import mongoose from 'mongoose';

const vehiculoSchema = new mongoose.Schema(
  {
    placa: {
      type: String,
      required: [true, 'La placa es obligatoria'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9]{6,10}$/,
        'La placa debe tener entre 6 y 10 caracteres alfanuméricos',
      ],
    },
    marca: {
      type: String,
      required: [true, 'La marca es obligatoria'],
      trim: true,
      maxlength: [50, 'La marca no puede exceder 50 caracteres'],
    },
    modelo: {
      type: String,
      required: [true, 'El modelo es obligatorio'],
      trim: true,
      maxlength: [50, 'El modelo no puede exceder 50 caracteres'],
    },
    año: {
      type: Number,
      required: [true, 'El año es obligatorio'],
      min: [1900, 'El año debe ser mayor a 1900'],
      max: [
        new Date().getFullYear() + 1,
        'El año no puede ser mayor al año actual',
      ],
    },
    tipo: {
      type: String,
      enum: {
        values: ['camion', 'camioneta', 'van', 'motocicleta'],
        message: '{VALUE} no es un tipo de vehículo válido',
      },
      required: [true, 'El tipo de vehículo es obligatorio'],
    },
    capacidad_carga: {
      type: Number,
      required: [true, 'La capacidad de carga es obligatoria'],
      min: [0, 'La capacidad de carga debe ser un número positivo'],
    },
    unidad_capacidad: {
      type: String,
      enum: {
        values: ['kg', 'toneladas', 'm3'],
        message: '{VALUE} no es una unidad válida',
      },
      default: 'kg',
    },
    estado: {
      type: String,
      enum: {
        values: ['disponible', 'mantenimiento', 'en_ruta'],
        message: '{VALUE} no es un estado válido',
      },
      default: 'disponible',
      required: true,
    },
    conductor_asignado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
      validate: {
        validator: async function (conductorId) {
          if (!conductorId) return true; // Permitir null

          const Usuario = mongoose.model('Usuario');
          const conductor = await Usuario.findById(conductorId);

          return conductor && conductor.rol === 'conductor';
        },
        message: 'El usuario asignado debe tener rol de conductor',
      },
    },
    kilometraje: {
      type: Number,
      min: [0, 'El kilometraje no puede ser negativo'],
      default: 0,
    },
    ultimoMantenimiento: {
      type: Date,
    },
    proximoMantenimiento: {
      type: Date,
    },
    documentos: {
      seguro: {
        numeroPoliza: String,
        vencimiento: Date,
        aseguradora: String,
      },
      tecnicomecanica: {
        numero: String,
        vencimiento: Date,
      },
      tarjetaOperacion: {
        numero: String,
        vencimiento: Date,
      },
    },
    observaciones: {
      type: String,
      trim: true,
      maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índices
// placa ya tiene índice automático por unique: true
vehiculoSchema.index({ estado: 1 });
vehiculoSchema.index({ conductor_asignado: 1 });

// Virtual para verificar si requiere mantenimiento
vehiculoSchema.virtual('requiereMantenimiento').get(function () {
  if (!this.proximoMantenimiento) return false;
  const hoy = new Date();
  const diasParaMantenimiento = Math.ceil(
    (this.proximoMantenimiento - hoy) / (1000 * 60 * 60 * 24),
  );
  return diasParaMantenimiento <= 7; // Alerta si faltan 7 días o menos
});

// Virtual para verificar documentos vencidos
vehiculoSchema.virtual('documentosVencidos').get(function () {
  const hoy = new Date();
  const vencidos = [];

  if (
    this.documentos.seguro?.vencimiento &&
    this.documentos.seguro.vencimiento < hoy
  ) {
    vencidos.push('seguro');
  }
  if (
    this.documentos.tecnicomecanica?.vencimiento &&
    this.documentos.tecnicomecanica.vencimiento < hoy
  ) {
    vencidos.push('tecnicomecanica');
  }
  if (
    this.documentos.tarjetaOperacion?.vencimiento &&
    this.documentos.tarjetaOperacion.vencimiento < hoy
  ) {
    vencidos.push('tarjetaOperacion');
  }

  return vencidos;
});

// Método para verificar disponibilidad
vehiculoSchema.methods.estaDisponible = function () {
  return this.estado === 'disponible' && this.documentosVencidos.length === 0;
};

// Método para asignar conductor
vehiculoSchema.methods.asignarConductor = async function (conductorId) {
  const Usuario = mongoose.model('Usuario');
  const conductor = await Usuario.findById(conductorId);

  if (!conductor) {
    throw new Error('Conductor no encontrado');
  }

  if (conductor.rol !== 'conductor') {
    throw new Error('El usuario debe tener rol de conductor');
  }

  if (this.estado !== 'disponible') {
    throw new Error(
      `El vehículo no está disponible. Estado actual: ${this.estado}`,
    );
  }

  this.conductor_asignado = conductorId;
  return await this.save();
};

// Método para liberar conductor
vehiculoSchema.methods.liberarConductor = async function () {
  this.conductor_asignado = null;
  if (this.estado === 'en_ruta') {
    this.estado = 'disponible';
  }
  return await this.save();
};

// Método para cambiar estado
vehiculoSchema.methods.cambiarEstado = async function (nuevoEstado) {
  const estadosValidos = ['disponible', 'mantenimiento', 'en_ruta'];

  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error('Estado no válido');
  }

  this.estado = nuevoEstado;
  return await this.save();
};

// Middleware pre-save: Validar que vehículo en ruta tenga conductor
vehiculoSchema.pre('save', function (next) {
  if (this.estado === 'en_ruta' && !this.conductor_asignado) {
    return next(
      new Error('Un vehículo en ruta debe tener un conductor asignado'),
    );
  }
  next();
});

// Asegurar que los virtuals se incluyan en JSON
vehiculoSchema.set('toJSON', { virtuals: true });
vehiculoSchema.set('toObject', { virtuals: true });

const Vehiculo = mongoose.model('Vehiculo', vehiculoSchema);

export default Vehiculo;
