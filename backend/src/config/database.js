import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const opciones = {
      // useNewUrlParser y useUnifiedTopology ya no son necesarios en Mongoose 6+
      // pero puedes agregar otras opciones según necesites
      maxPoolSize: 10, // Máximo de conexiones simultáneas
      serverSelectionTimeoutMS: 5000, // Timeout para seleccionar servidor
      socketTimeoutMS: 45000, // Timeout para operaciones
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, opciones);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);

    // Eventos de la conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });

    // Manejo de cierre graceful
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB desconectado debido a cierre de aplicación');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    // En desarrollo, mostrar el error completo
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    // Salir del proceso con error
    process.exit(1);
  }
};

export default connectDB;
