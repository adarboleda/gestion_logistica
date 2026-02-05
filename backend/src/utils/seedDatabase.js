import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';
import Bodega from '../models/Bodega.js';
import Producto from '../models/Producto.js';
import Vehiculo from '../models/Vehiculo.js';
import Ruta from '../models/Ruta.js';
import Movimiento from '../models/Movimiento.js';
import Entrega from '../models/Entrega.js';

// Cargar variables de entorno
dotenv.config();

/**
 * Script para poblar la base de datos con datos de prueba
 * Ejecutar: node src/utils/seedDatabase.js
 *
 * NOTA: Las entregas se crean automáticamente cuando una ruta pasa a estado 'completada'
 */
const seedDatabase = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Limpiar colecciones existentes (CUIDADO: Esto borrará todos los datos)
    console.log('🗑️  Limpiando base de datos...');
    await Entrega.deleteMany({});
    await Movimiento.deleteMany({});
    await Ruta.deleteMany({});
    await Vehiculo.deleteMany({});
    await Producto.deleteMany({});
    await Bodega.deleteMany({});
    await Usuario.deleteMany({});
    console.log('✅ Base de datos limpia\n');

    // ========== CREAR USUARIOS ==========
    console.log('👥 Creando usuarios...');

    const usuariosData = [
      {
        nombre: 'Administrador Principal',
        email: 'admin@logistica.com',
        password: 'admin123',
        rol: 'admin',
        telefono: '0991234567',
      },
      {
        nombre: 'Carlos Coordinador',
        email: 'coordinador@logistica.com',
        password: 'coord123',
        rol: 'coordinador',
        telefono: '0999876543',
      },
      {
        nombre: 'Juan Conductor',
        email: 'conductor1@logistica.com',
        password: 'cond123',
        rol: 'conductor',
        telefono: '0985551111',
      },
      {
        nombre: 'Pedro Conductor',
        email: 'conductor2@logistica.com',
        password: 'cond123',
        rol: 'conductor',
        telefono: '0985552222',
      },
      {
        nombre: 'María Operadora',
        email: 'operador@logistica.com',
        password: 'oper123',
        rol: 'operador',
        telefono: '0985553333',
      },
    ];

    // Crear usuarios uno por uno para ejecutar el middleware de hash
    const usuarios = [];
    for (const userData of usuariosData) {
      const usuario = await Usuario.create(userData);
      usuarios.push(usuario);
    }

    console.log(`✅ ${usuarios.length} usuarios creados\n`);

    // ========== CREAR BODEGAS ==========
    console.log('🏢 Creando bodegas...');

    const bodegas = await Bodega.insertMany([
      {
        nombre: 'Bodega Central Quito',
        direccion: {
          calle: 'Av. 10 de Agosto N35-120',
          ciudad: 'Quito',
          estado: 'Pichincha',
          codigoPostal: '170507',
        },
        estado: 'activa',
        capacidadMaxima: 10000,
        descripcion: 'Bodega principal de distribución en Quito',
      },
      {
        nombre: 'Bodega Puerto Guayaquil',
        direccion: {
          calle: 'Av. de las Américas Km 6.5',
          ciudad: 'Guayaquil',
          estado: 'Guayas',
          codigoPostal: '090101',
        },
        estado: 'activa',
        capacidadMaxima: 8000,
        descripcion: 'Bodega de distribución regional zona costa',
      },
      {
        nombre: 'Bodega Sur Cuenca',
        direccion: {
          calle: 'Av. Huayna Cápac 1-234',
          ciudad: 'Cuenca',
          estado: 'Azuay',
          codigoPostal: '010101',
        },
        estado: 'activa',
        capacidadMaxima: 6000,
        descripcion: 'Bodega para región austral',
      },
    ]);

    console.log(`✅ ${bodegas.length} bodegas creadas\n`);

    // ========== CREAR PRODUCTOS ==========
    console.log('📦 Creando productos...');

    const productosData = [
      {
        nombre: 'Laptop Dell Inspiron 15',
        codigo: 'ELEC-001',
        descripcion: 'Laptop para uso empresarial',
        categoria: 'Electrónica',
        stock_actual: 50,
        stock_minimo: 10,
        precio: 2500000,
        bodega: bodegas[0]._id,
      },
      {
        nombre: 'Mouse Inalámbrico Logitech',
        codigo: 'ELEC-002',
        descripcion: 'Mouse ergonómico inalámbrico',
        categoria: 'Electrónica',
        stock_actual: 100,
        stock_minimo: 20,
        precio: 80000,
        bodega: bodegas[0]._id,
      },
      {
        nombre: 'Arroz Diana x 50kg',
        codigo: 'ALIM-001',
        descripcion: 'Bulto de arroz Diana',
        categoria: 'Alimentos',
        stock_actual: 200,
        stock_minimo: 50,
        precio: 120000,
        bodega: bodegas[1]._id,
      },
      {
        nombre: 'Aceite de Cocina x 20L',
        codigo: 'ALIM-002',
        descripcion: 'Aceite vegetal para cocina',
        categoria: 'Alimentos',
        stock_actual: 150,
        stock_minimo: 30,
        precio: 85000,
        bodega: bodegas[1]._id,
      },
      {
        nombre: 'Camisetas Polo Talla M',
        codigo: 'TEXT-001',
        descripcion: 'Camisetas tipo polo corporativas',
        categoria: 'Textil',
        stock_actual: 300,
        stock_minimo: 50,
        precio: 45000,
        bodega: bodegas[2]._id,
      },
      {
        nombre: 'Acetaminofén 500mg Caja x100',
        codigo: 'FARM-001',
        descripcion: 'Medicamento analgésico',
        categoria: 'Farmacéutico',
        stock_actual: 500,
        stock_minimo: 100,
        precio: 25000,
        bodega: bodegas[0]._id,
      },
    ];

    const productos = [];
    for (const productoData of productosData) {
      const producto = await Producto.create(productoData);
      productos.push(producto);
    }

    console.log(`✅ ${productos.length} productos creados\n`);

    // ========== CREAR VEHÍCULOS ==========
    console.log('🚚 Creando vehículos...');

    const conductores = usuarios.filter((u) => u.rol === 'conductor');

    const vehiculosData = [
      {
        placa: 'ABC123',
        marca: 'Chevrolet',
        modelo: 'NPR',
        año: 2022,
        tipo: 'camion',
        capacidad_carga: 5000,
        unidad_capacidad: 'kg',
        estado: 'disponible',
        conductor_asignado: conductores[0]._id,
        kilometraje: 15000,
        documentos: {
          seguro: {
            numeroPoliza: 'SEG-2024-001',
            vencimiento: new Date('2026-12-31'),
            aseguradora: 'Seguros Bolívar',
          },
          tecnicomecanica: {
            numero: 'TM-2024-001',
            vencimiento: new Date('2026-06-30'),
          },
        },
      },
      {
        placa: 'XYZ789',
        marca: 'Mercedes-Benz',
        modelo: 'Sprinter',
        año: 2023,
        tipo: 'van',
        capacidad_carga: 2000,
        unidad_capacidad: 'kg',
        estado: 'disponible',
        conductor_asignado: conductores[1]._id,
        kilometraje: 8000,
        documentos: {
          seguro: {
            numeroPoliza: 'SEG-2024-002',
            vencimiento: new Date('2026-12-31'),
            aseguradora: 'Seguros del Estado',
          },
          tecnicomecanica: {
            numero: 'TM-2024-002',
            vencimiento: new Date('2026-08-15'),
          },
        },
      },
      {
        placa: 'DEF456',
        marca: 'Hino',
        modelo: 'Serie 500',
        año: 2021,
        tipo: 'camion',
        capacidad_carga: 8000,
        unidad_capacidad: 'kg',
        estado: 'mantenimiento',
        kilometraje: 45000,
        documentos: {
          seguro: {
            numeroPoliza: 'SEG-2024-003',
            vencimiento: new Date('2026-12-31'),
            aseguradora: 'Seguros Bolívar',
          },
          tecnicomecanica: {
            numero: 'TM-2024-003',
            vencimiento: new Date('2026-05-20'),
          },
        },
      },
    ];

    const vehiculos = [];
    for (const vehiculoData of vehiculosData) {
      const vehiculo = await Vehiculo.create(vehiculoData);
      vehiculos.push(vehiculo);
    }

    console.log(`✅ ${vehiculos.length} vehículos creados\n`);

    // ========== RUTAS ==========
    // NOTA: No se crean rutas para que el usuario las cree desde la interfaz
    // Las entregas se crean automáticamente cuando una ruta pasa a estado 'completada'
    console.log('🗺️  No se crean rutas - créalas desde la interfaz\n');

    // ========== CREAR MOVIMIENTOS ==========
    console.log('📊 Creando movimientos de inventario...');

    const movimientosData = [
      {
        tipo: 'entrada',
        producto: productos[0]._id,
        cantidad: 25,
        usuario_responsable: usuarios[0]._id,
        bodegaDestino: bodegas[0]._id,
        motivoMovimiento: 'compra',
        observaciones: 'Compra inicial de laptops para stock',
        documentoReferencia: 'OC-2026-001',
      },
      {
        tipo: 'entrada',
        producto: productos[1]._id,
        cantidad: 50,
        usuario_responsable: usuarios[4]._id,
        bodegaDestino: bodegas[0]._id,
        motivoMovimiento: 'compra',
        observaciones: 'Reposición de accesorios',
        documentoReferencia: 'OC-2026-002',
      },
      {
        tipo: 'entrada',
        producto: productos[2]._id,
        cantidad: 100,
        usuario_responsable: usuarios[1]._id,
        bodegaDestino: bodegas[1]._id,
        motivoMovimiento: 'compra',
        observaciones: 'Compra mensual de alimentos',
        documentoReferencia: 'OC-2026-003',
      },
      {
        tipo: 'salida',
        producto: productos[0]._id,
        cantidad: 15,
        usuario_responsable: usuarios[4]._id,
        bodegaOrigen: bodegas[0]._id,
        motivoMovimiento: 'venta',
        observaciones: 'Venta a empresa TechCorp Ecuador',
        documentoReferencia: 'FAC-2026-001',
      },
      {
        tipo: 'transferencia',
        producto: productos[5]._id,
        cantidad: 50,
        usuario_responsable: usuarios[1]._id,
        bodegaOrigen: bodegas[0]._id,
        bodegaDestino: bodegas[2]._id,
        motivoMovimiento: 'transferencia_bodegas',
        observaciones: 'Transferencia para suplir demanda en zona austral',
        documentoReferencia: 'TRANS-2026-001',
      },
    ];

    const movimientos = [];
    for (const movData of movimientosData) {
      try {
        const movimiento = await Movimiento.create(movData);
        movimientos.push(movimiento);
        console.log(`  ✓ Movimiento ${movimiento.tipo} creado`);
      } catch (error) {
        console.error(`  ✗ Error en movimiento: ${error.message}`);
      }
    }

    console.log(`✅ ${movimientos.length} movimientos creados\n`);

    // ========== NO SE CREAN ENTREGAS ==========
    // Las entregas se crean automáticamente cuando una ruta pasa a estado 'completada'
    console.log('📬 NOTA: No se crean entregas manualmente.');
    console.log(
      '   Las entregas se generan cuando una ruta pasa a estado "completada".\n',
    );

    // ========== RESUMEN ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE DATOS CREADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👥 Usuarios: ${usuarios.length}`);
    console.log(`🏢 Bodegas: ${bodegas.length}`);
    console.log(`📦 Productos: ${productos.length}`);
    console.log(`🚚 Vehículos: ${vehiculos.length}`);
    console.log(`🗺️  Rutas: 0 (crear desde interfaz)`);
    console.log(`📊 Movimientos: ${movimientos.length}`);
    console.log(`📬 Entregas: 0 (se crean al completar rutas)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('👤 CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:        admin@logistica.com / admin123');
    console.log('Coordinador:  coordinador@logistica.com / coord123');
    console.log('Conductor 1:  conductor1@logistica.com / cond123');
    console.log('Conductor 2:  conductor2@logistica.com / cond123');
    console.log('Operador:     operador@logistica.com / oper123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🗺️  RUTAS PARA PRUEBA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• 2 Planificadas (listas para iniciar)');
    console.log('• 1 En Tránsito (lista para completar)');
    console.log('\n💡 FLUJO DE ENTREGAS:');
    console.log('   1. Completar una ruta desde el módulo de Rutas');
    console.log('   2. Se crea automáticamente una Entrega pendiente');
    console.log('   3. El conductor marca el estado en el módulo de Entregas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
    console.log('✅ Proceso completado exitosamente\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach((key) => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

// Ejecutar
seedDatabase();
