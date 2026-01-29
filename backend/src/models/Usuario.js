import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No devolver el password en las consultas por defecto
    },
    rol: {
      type: String,
      enum: {
        values: ['admin', 'coordinador', 'conductor', 'operador'],
        message: '{VALUE} no es un rol válido',
      },
      default: 'operador',
      required: [true, 'El rol es obligatorio'],
    },
    telefono: {
      type: String,
      trim: true,
      match: [
        /^[0-9]{10}$/,
        'El teléfono debe contener exactamente 10 dígitos',
      ],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false,
  },
);

// Índices para optimizar búsquedas
// email ya tiene índice automático por unique: true
usuarioSchema.index({ rol: 1 });

// Middleware pre-save: Hashear password antes de guardar
usuarioSchema.pre('save', async function (next) {
  // Solo hashear si el password fue modificado o es nuevo
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
usuarioSchema.methods.compararPassword = async function (passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

// Método para obtener datos públicos del usuario (sin password)
usuarioSchema.methods.toJSON = function () {
  const usuario = this.toObject();
  delete usuario.password;
  return usuario;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;
