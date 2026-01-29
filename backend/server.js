import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import usuarioRoutes from './src/routes/usuario.routes.js';
import productoRoutes from './src/routes/producto.routes.js';
import movimientoRoutes from './src/routes/movimiento.routes.js';
import bodegaRoutes from './src/routes/bodega.routes.js';
import vehiculoRoutes from './src/routes/vehiculo.routes.js';
import rutaRoutes from './src/routes/ruta.routes.js';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Conectar a la base de datos
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'API de Plataforma de Gestión de Logística',
    version: '1.0.0',
    status: 'active',
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/bodegas', bodegaRoutes);
app.use('/api/vehiculos', vehiculoRoutes);
app.use('/api/rutas', rutaRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
