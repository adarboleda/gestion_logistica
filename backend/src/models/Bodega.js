import mongoose from 'mongoose';

const bodegaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la bodega es obligatorio'],
      trim: true,
      unique: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    direccion: {
      calle: {
        type: String,
        required: [true, 'La calle es obligatoria'],
        trim: true,
      },
      ciudad: {
        type: String,
        required: [true, 'La ciudad es obligatoria'],
        trim: true,
      },
      estado: {
        type: String,
        required: [true, 'El estado es obligatorio'],
        trim: true,
      },
      codigoPostal: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            // Validar formato: exactamente 6 dígitos
            if (!/^\d{6}$/.test(v)) return false;
            // Validar rango de provincia: los dos primeros dígitos deben estar entre 01 y 24
            const provincia = parseInt(v.substring(0, 2));
            return provincia >= 1 && provincia <= 24;
          },
          message:
            'El código postal debe tener 6 dígitos y los dos primeros deben corresponder a una provincia válida de Ecuador (01-24)',
        },
      },
    },
    estado: {
      type: String,
      enum: {
        values: ['activa', 'inactiva'],
        message: '{VALUE} no es un estado válido',
      },
      default: 'activa',
      required: true,
    },
    capacidadMaxima: {
      type: Number,
      min: [0, 'La capacidad debe ser un número positivo'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índices
// nombre ya tiene índice automático por unique: true
bodegaSchema.index({ estado: 1 });
bodegaSchema.index({ 'direccion.ciudad': 1 });

// Virtual para obtener dirección completa
bodegaSchema.virtual('direccionCompleta').get(function () {
  const dir = this.direccion;
  return `${dir.calle}, ${dir.ciudad}, ${dir.estado}${dir.codigoPostal ? ' ' + dir.codigoPostal : ''}`;
});

// Asegurar que los virtuals se incluyan en JSON
bodegaSchema.set('toJSON', { virtuals: true });
bodegaSchema.set('toObject', { virtuals: true });

const Bodega = mongoose.model('Bodega', bodegaSchema);

export default Bodega;
