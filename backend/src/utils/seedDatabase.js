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

    // IMPORTANTE: Usar create() en lugar de insertMany() para que se ejecute
    // el middleware pre-save que hashea las contraseñas
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

    // IMPORTANTE: Usar create() en lugar de insertMany() para ejecutar
    // el middleware pre-save que valida el stock
    const productosData = [
      {
        nombre: 'Laptop Dell Inspiron 15',
        codigo: 'ELEC-001',
        descripcion: 'Laptop para uso empresarial',
        categoria: 'Electrónica',
        stock_actual: 50,
        stock_minimo: 10,
        unidadMedida: 'unidad',
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
        unidadMedida: 'unidad',
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
        unidadMedida: 'kg',
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
        unidadMedida: 'litro',
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
        unidadMedida: 'unidad',
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
        unidadMedida: 'caja',
        precio: 25000,
        bodega: bodegas[0]._id,
      },
    ];

    // Crear productos uno por uno para ejecutar el middleware de validación
    const productos = [];
    for (const productoData of productosData) {
      const producto = await Producto.create(productoData);
      productos.push(producto);
    }

    console.log(`✅ ${productos.length} productos creados\n`);

    // ========== CREAR VEHÍCULOS ==========
    console.log('🚚 Creando vehículos...');

    const conductores = usuarios.filter((u) => u.rol === 'conductor');

    // IMPORTANTE: Usar create() en lugar de insertMany() para ejecutar
    // el middleware pre-save que valida conductores asignados
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

    // Crear vehículos uno por uno para ejecutar el middleware de validación
    const vehiculos = [];
    for (const vehiculoData of vehiculosData) {
      const vehiculo = await Vehiculo.create(vehiculoData);
      vehiculos.push(vehiculo);
    }

    console.log(`✅ ${vehiculos.length} vehículos creados\n`);

    // ========== CREAR RUTAS ==========
    console.log('🗺️  Creando rutas...');

    const rutasData = [
      {
        origen: {
          nombre: 'Bodega Central Quito',
          direccion: 'Av. 10 de Agosto N35-120, Quito',
          coordenadas: {
            latitud: -0.180653,
            longitud: -78.467834,
          },
        },
        destino: {
          nombre: 'Cliente Zona Norte Quito',
          direccion: 'Av. Eloy Alfaro N45-12, Quito',
          coordenadas: {
            latitud: -0.150207,
            longitud: -78.478431,
          },
          contacto: {
            nombre: 'Roberto Gómez',
            telefono: '0981234567',
            email: 'roberto@cliente.com',
          },
        },
        fecha_programada: new Date('2026-02-05T08:00:00'),
        vehiculo: vehiculos[0]._id,
        conductor: conductores[0]._id,
        lista_productos: [
          {
            producto: productos[0]._id, // Laptop Dell
            cantidad: 10,
            entregado: 0,
          },
          {
            producto: productos[1]._id, // Mouse Logitech
            cantidad: 20,
            entregado: 0,
          },
        ],
        estado: 'planificada',
        prioridad: 'alta',
        distancia_km: 15.5,
        tiempo_estimado_horas: 1.5,
        observaciones: 'Cliente importante, entrega prioritaria',
      },
      {
        origen: {
          nombre: 'Bodega Puerto Guayaquil',
          direccion: 'Av. de las Américas Km 6.5, Guayaquil',
          coordenadas: {
            latitud: -2.203816,
            longitud: -79.897453,
          },
        },
        destino: {
          nombre: 'Supermercado La Favorita',
          direccion: 'Av. Francisco de Orellana, Guayaquil',
          coordenadas: {
            latitud: -2.170833,
            longitud: -79.890553,
          },
          contacto: {
            nombre: 'Andrea López',
            telefono: '0929876543',
            email: 'andrea@favorita.com',
          },
        },
        fecha_programada: new Date('2026-02-04T10:00:00'),
        vehiculo: vehiculos[1]._id,
        conductor: conductores[1]._id,
        lista_productos: [
          {
            producto: productos[2]._id, // Arroz
            cantidad: 50,
            entregado: 50,
          },
          {
            producto: productos[3]._id, // Aceite
            cantidad: 30,
            entregado: 30,
          },
        ],
        estado: 'completada',
        prioridad: 'media',
        distancia_km: 8.2,
        tiempo_estimado_horas: 0.5,
        fecha_inicio_real: new Date('2026-02-04T09:55:00'),
        fecha_fin_real: new Date('2026-02-04T11:20:00'),
        tracking: [
          {
            fecha: new Date('2026-02-04T10:00:00'),
            latitud: -2.203816,
            longitud: -79.897453,
            velocidad: 0,
            observacion: 'Salida de bodega',
          },
          {
            fecha: new Date('2026-02-04T10:15:00'),
            latitud: -2.190123,
            longitud: -79.893432,
            velocidad: 45,
            observacion: 'En ruta',
          },
          {
            fecha: new Date('2026-02-04T10:40:00'),
            latitud: -2.170833,
            longitud: -79.890553,
            velocidad: 0,
            observacion: 'Llegada a destino',
          },
        ],
        observaciones: 'Entrega completada sin novedades',
      },
      {
        origen: {
          nombre: 'Bodega Sur Cuenca',
          direccion: 'Av. Huayna Cápac 1-234, Cuenca',
          coordenadas: {
            latitud: -2.900128,
            longitud: -79.005896,
          },
        },
        destino: {
          nombre: 'Hospital del IESS Cuenca',
          direccion: 'Av. Huayna Cápac y 12 de Abril, Cuenca',
          coordenadas: {
            latitud: -2.906889,
            longitud: -79.010387,
          },
          contacto: {
            nombre: 'Dr. Carlos Mendoza',
            telefono: '0978889999',
            email: 'cmendoza@iess.gob.ec',
          },
        },
        fecha_programada: new Date('2026-02-10T07:00:00'),
        vehiculo: vehiculos[1]._id,
        conductor: conductores[1]._id,
        lista_productos: [
          {
            producto: productos[5]._id, // Acetaminofén
            cantidad: 100,
            entregado: 0,
          },
        ],
        estado: 'cancelada',
        prioridad: 'urgente',
        distancia_km: 12.3,
        tiempo_estimado_horas: 1,
        motivo_cancelacion: 'Cliente canceló el pedido',
        observaciones: 'Reprogramar para la próxima semana',
      },
    ];

    // Crear rutas usando create para ejecutar los middlewares
    const rutas = [];
    for (const rutaData of rutasData) {
      const ruta = await Ruta.create(rutaData);
      rutas.push(ruta);
    }

    console.log(`✅ ${rutas.length} rutas creadas\n`);

    // ========== CREAR MOVIMIENTOS ==========
    console.log('📊 Creando movimientos de inventario...');

    // IMPORTANTE: Los movimientos se deben crear con create() porque tienen
    // middleware pre-save que actualiza automáticamente el stock de los productos
    // Cada producto tiene su bodega asignada, usamos eso para las bodegas de origen/destino
    const movimientosData = [
      // Entradas (compras) - Incrementan el stock
      // Productos[0] y [1] están en bodegas[0] (Quito)
      // Productos[2] y [3] están en bodegas[1] (Guayaquil)
      // Productos[4] está en bodegas[2] (Cuenca)
      // Productos[5] está en bodegas[0] (Quito)
      {
        tipo: 'entrada',
        producto: productos[0]._id, // Laptop Dell - Bodega Quito
        cantidad: 25,
        usuario_responsable: usuarios[0]._id, // Admin
        bodegaDestino: bodegas[0]._id, // Bodega Central Quito
        motivoMovimiento: 'compra',
        observaciones: 'Compra inicial de laptops para stock',
        documentoReferencia: 'OC-2026-001',
      },
      {
        tipo: 'entrada',
        producto: productos[1]._id, // Mouse Logitech - Bodega Quito
        cantidad: 50,
        usuario_responsable: usuarios[4]._id, // Operador
        bodegaDestino: bodegas[0]._id, // Bodega Central Quito
        motivoMovimiento: 'compra',
        observaciones: 'Reposición de accesorios',
        documentoReferencia: 'OC-2026-002',
      },
      {
        tipo: 'entrada',
        producto: productos[2]._id, // Arroz Diana - Bodega Guayaquil
        cantidad: 100,
        usuario_responsable: usuarios[1]._id, // Coordinador
        bodegaDestino: bodegas[1]._id, // Bodega Puerto Guayaquil
        motivoMovimiento: 'compra',
        observaciones: 'Compra mensual de alimentos',
        documentoReferencia: 'OC-2026-003',
      },
      {
        tipo: 'entrada',
        producto: productos[5]._id, // Acetaminofén - Bodega Quito
        cantidad: 200,
        usuario_responsable: usuarios[0]._id, // Admin
        bodegaDestino: bodegas[0]._id, // Bodega Central Quito
        motivoMovimiento: 'compra',
        observaciones: 'Stock de medicamentos para distribución',
        documentoReferencia: 'OC-2026-004',
      },
      {
        tipo: 'entrada',
        producto: productos[4]._id, // Camisetas Polo - Bodega Cuenca
        cantidad: 150,
        usuario_responsable: usuarios[1]._id, // Coordinador
        bodegaDestino: bodegas[2]._id, // Bodega Sur Cuenca
        motivoMovimiento: 'compra',
        observaciones: 'Stock inicial de textiles',
        documentoReferencia: 'OC-2026-005',
      },

      // Salidas (ventas) - Decrementan el stock
      {
        tipo: 'salida',
        producto: productos[0]._id, // Laptop Dell - Bodega Quito
        cantidad: 15,
        usuario_responsable: usuarios[4]._id, // Operador
        bodegaOrigen: bodegas[0]._id, // Bodega Central Quito
        motivoMovimiento: 'venta',
        observaciones: 'Venta a empresa TechCorp Ecuador',
        documentoReferencia: 'FAC-2026-001',
      },
      {
        tipo: 'salida',
        producto: productos[1]._id, // Mouse Logitech - Bodega Quito
        cantidad: 30,
        usuario_responsable: usuarios[4]._id, // Operador
        bodegaOrigen: bodegas[0]._id, // Bodega Central Quito
        motivoMovimiento: 'venta',
        observaciones: 'Venta al por mayor',
        documentoReferencia: 'FAC-2026-002',
      },
      {
        tipo: 'salida',
        producto: productos[2]._id, // Arroz Diana - Bodega Guayaquil
        cantidad: 50,
        usuario_responsable: usuarios[1]._id, // Coordinador
        bodegaOrigen: bodegas[1]._id, // Bodega Puerto Guayaquil
        motivoMovimiento: 'venta',
        observaciones: 'Despacho a Supermercado La Favorita',
        documentoReferencia: 'FAC-2026-003',
      },

      // Ajustes de inventario (daño)
      {
        tipo: 'salida',
        producto: productos[3]._id, // Aceite de Cocina - Bodega Guayaquil
        cantidad: 5,
        usuario_responsable: usuarios[4]._id, // Operador
        bodegaOrigen: bodegas[1]._id, // Bodega Puerto Guayaquil
        motivoMovimiento: 'daño',
        observaciones: 'Producto dañado durante almacenamiento',
        documentoReferencia: 'AJ-2026-001',
      },

      // Devolución (entrada)
      {
        tipo: 'entrada',
        producto: productos[4]._id, // Camisetas Polo - Bodega Cuenca
        cantidad: 20,
        usuario_responsable: usuarios[1]._id, // Coordinador
        bodegaDestino: bodegas[2]._id, // Bodega Sur Cuenca
        motivoMovimiento: 'devolucion',
        observaciones: 'Devolución de cliente por talla incorrecta',
        documentoReferencia: 'DEV-2026-001',
      },

      // Transferencias entre bodegas
      {
        tipo: 'transferencia',
        producto: productos[5]._id, // Acetaminofén
        cantidad: 100,
        usuario_responsable: usuarios[1]._id, // Coordinador
        bodegaOrigen: bodegas[0]._id, // Quito
        bodegaDestino: bodegas[2]._id, // Cuenca
        motivoMovimiento: 'transferencia_bodegas',
        observaciones: 'Transferencia para suplir demanda en zona austral',
        documentoReferencia: 'TRANS-2026-001',
      },
      {
        tipo: 'transferencia',
        producto: productos[2]._id, // Arroz Diana
        cantidad: 30,
        usuario_responsable: usuarios[1]._id, // Coordinador
        bodegaOrigen: bodegas[1]._id, // Guayaquil
        bodegaDestino: bodegas[0]._id, // Quito
        motivoMovimiento: 'transferencia_bodegas',
        observaciones: 'Reposición de stock en bodega central',
        documentoReferencia: 'TRANS-2026-002',
      },
    ];

    // Crear movimientos uno por uno (NO usar insertMany)
    // porque el middleware pre-save actualiza el stock automáticamente
    const movimientos = [];
    for (const movData of movimientosData) {
      try {
        const movimiento = await Movimiento.create(movData);
        movimientos.push(movimiento);
        console.log(
          `  ✓ Movimiento ${movimiento.tipo} creado - Producto: ${movData.producto}`,
        );
      } catch (error) {
        console.error(`  ✗ Error en movimiento: ${error.message}`);
      }
    }

    console.log(`✅ ${movimientos.length} movimientos creados\n`);

    // ========== CREAR ENTREGAS ==========
    console.log('🚚 Creando entregas...');

    // NOTA: Las entregas se crean automáticamente cuando una ruta pasa a estado 'en_transito'
    // El conductor marca el estado final de la entrega (entregado, parcial, rechazado, etc.)
    // El tracking GPS está en el modelo de Ruta, no en Entrega
    const entregasData = [
      // Entrega completada - corresponde a ruta[1] (completada)
      {
        ruta: rutas[1]._id,
        conductor: conductores[1]._id,
        vehiculo: vehiculos[1]._id,
        cliente: {
          nombre: 'Supermercado La Favorita',
          direccion: 'Av. Francisco de Orellana, Guayaquil',
          telefono: '0429876543',
          email: 'bodega@favorita.com',
        },
        origen: {
          nombre: 'Bodega Puerto Guayaquil',
          direccion: 'Av. de las Américas Km 6.5, Guayaquil',
        },
        productos: [
          {
            producto: productos[2]._id, // Arroz Diana
            cantidadProgramada: 50,
            cantidadEntregada: 50,
          },
          {
            producto: productos[3]._id, // Aceite
            cantidadProgramada: 30,
            cantidadEntregada: 30,
          },
        ],
        estado: 'entregado',
        fecha_programada: new Date('2026-02-04T10:00:00'),
        fecha_entrega: new Date('2026-02-04T11:20:00'),
        calificacion: 5,
        observaciones:
          'Entrega completada sin novedades - Productos de alimentos',
      },
      // Entrega pendiente - ruta en tránsito, esperando que conductor marque estado
      {
        ruta: rutas[0]._id,
        conductor: conductores[0]._id,
        vehiculo: vehiculos[0]._id,
        cliente: {
          nombre: 'TechCorp Ecuador - Roberto Gómez',
          direccion: 'Av. Eloy Alfaro N45-12, Quito',
          telefono: '0981234567',
          email: 'roberto@techcorp.ec',
        },
        origen: {
          nombre: 'Bodega Central Quito',
          direccion: 'Av. 10 de Agosto N35-120, Quito',
        },
        productos: [
          {
            producto: productos[0]._id, // Laptop Dell
            cantidadProgramada: 10,
            cantidadEntregada: 0,
          },
          {
            producto: productos[1]._id, // Mouse Logitech
            cantidadProgramada: 20,
            cantidadEntregada: 0,
          },
        ],
        estado: 'pendiente',
        fecha_programada: new Date('2026-02-05T08:00:00'),
        observaciones: 'Entrega de equipos tecnológicos - Cliente prioritario',
      },
      // Entrega parcial - algunos productos no entregados
      {
        ruta: rutas[0]._id,
        conductor: conductores[0]._id,
        vehiculo: vehiculos[0]._id,
        cliente: {
          nombre: 'Farmacia Cruz Azul Central',
          direccion: 'Av. Amazonas N24-56, Quito',
          telefono: '0998765432',
          email: 'pedidos@cruzazul.ec',
        },
        origen: {
          nombre: 'Bodega Central Quito',
          direccion: 'Av. 10 de Agosto N35-120, Quito',
        },
        productos: [
          {
            producto: productos[5]._id, // Acetaminofén
            cantidadProgramada: 50,
            cantidadEntregada: 30,
            observacion: 'Solo había espacio en farmacia para 30 cajas',
          },
        ],
        estado: 'parcial',
        fecha_programada: new Date('2026-02-03T08:00:00'),
        fecha_entrega: new Date('2026-02-03T09:45:00'),
        observaciones: 'Entrega parcial por falta de espacio en farmacia',
        calificacion: 4,
      },
      // Entrega rechazada - cliente rechazó la entrega
      {
        ruta: rutas[0]._id,
        conductor: conductores[0]._id,
        vehiculo: vehiculos[0]._id,
        cliente: {
          nombre: 'Distribuidora del Valle',
          direccion: 'Av. Galo Plaza Lasso N45-89, Quito',
          telefono: '0987654321',
          email: 'pedidos@delvalle.ec',
        },
        origen: {
          nombre: 'Bodega Central Quito',
          direccion: 'Av. 10 de Agosto N35-120, Quito',
        },
        productos: [
          {
            producto: productos[4]._id, // Camisetas Polo
            cantidadProgramada: 100,
            cantidadEntregada: 0,
          },
        ],
        estado: 'rechazado',
        fecha_programada: new Date('2026-02-02T14:00:00'),
        fecha_entrega: new Date('2026-02-02T15:30:00'),
        motivoNoEntrega:
          'Cliente rechazó por tallas incorrectas - pidió talla L en lugar de M',
        observaciones:
          'Mercadería devuelta a bodega - Coordinador debe gestionar cambio de tallas',
      },
    ];

    const entregas = [];
    for (const entregaData of entregasData) {
      try {
        const entrega = await Entrega.create(entregaData);
        entregas.push(entrega);
        console.log(
          `  ✓ Entrega ${entrega.numeroEntrega} creada - Cliente: ${entrega.cliente.nombre}`,
        );
      } catch (error) {
        console.error(`  ✗ Error en entrega: ${error.message}`);
      }
    }

    console.log(`✅ ${entregas.length} entregas creadas\n`);

    // ========== RESUMEN ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE DATOS CREADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👥 Usuarios: ${usuarios.length}`);
    console.log(`🏢 Bodegas: ${bodegas.length}`);
    console.log(`📦 Productos: ${productos.length}`);
    console.log(`🚚 Vehículos: ${vehiculos.length}`);
    console.log(`🗺️  Rutas: ${rutas.length}`);
    console.log(`📊 Movimientos: ${movimientos.length}`);
    console.log(`📬 Entregas: ${entregas.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('👤 CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:        admin@logistica.com / admin123');
    console.log('Coordinador:  coordinador@logistica.com / coord123');
    console.log('Conductor 1:  conductor1@logistica.com / cond123');
    console.log('Conductor 2:  conductor2@logistica.com / cond123');
    console.log('Operador:     operador@logistica.com / oper123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📬 ENTREGAS PARA PRUEBA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• 1 Pendiente (esperando que conductor marque estado)');
    console.log('• 1 Entregada (completada exitosamente con calificación)');
    console.log('• 1 Parcial (entrega parcial por falta de espacio)');
    console.log('• 1 Rechazada (cliente rechazó por tallas incorrectas)');
    console.log('\n💡 NOTA: El tracking GPS está en Rutas, no en Entregas');
    console.log(
      '   Las entregas se crean cuando la ruta pasa a estado en_transito',
    );
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 MOVIMIENTOS DE INVENTARIO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('• 5 Entradas (compras a bodegas específicas)');
    console.log('• 4 Salidas (ventas y ajustes desde bodegas)');
    console.log('• 2 Transferencias (entre bodegas)');
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
