# Plataforma de Gestión de Logística

Sistema integral de gestión logística desarrollado con el stack MERN (MongoDB, Express, React, Node.js).

## 🎯 Estado del Proyecto

### ✅ Completado

- **Módulo de Usuarios y Seguridad** (100%)
  - ✅ 6 Modelos de Mongoose (Usuario, Bodega, Producto, Movimiento, Vehiculo, Ruta)
  - ✅ 13 Endpoints REST funcionales
  - ✅ Autenticación JWT completa
  - ✅ Autorización por roles (Admin, Coordinador, Conductor, Operador)
  - ✅ CRUD completo de usuarios
  - ✅ Scripts de inicialización y seed
  - ✅ Documentación exhaustiva

### 🚧 Pendiente

- **Frontend React + PrimeReact**
- **Módulos adicionales** (Bodegas, Productos, Rutas, Tracking)

## 📋 Características Implementadas

### ✅ Módulo de Usuarios y Seguridad

- **Autenticación JWT**: Login seguro con tokens de expiración configurable
- **4 Roles de Usuario**: admin, coordinador, conductor, operador
- **Control de Acceso**: Middleware de autorización basado en roles
- **Gestión de Usuarios**: CRUD completo con validaciones
- **Seguridad**: Hash de contraseñas con bcrypt, soft delete
- **Validaciones**: Email único, formatos válidos, campos requeridos

### 📊 Modelos de Datos (Mongoose)

1. **Usuario**: Gestión de cuentas con roles y permisos
2. **Bodega**: Ubicaciones de almacenamiento con coordenadas
3. **Producto**: Inventario con stock y referencias a bodegas
4. **Movimiento**: Registro de entradas/salidas con actualización automática de stock
5. **Vehículo**: Flota con asignación de conductores y estados
6. **Ruta**: Planificación de entregas con tracking GPS

## 🛠️ Tecnologías

- **Frontend**: React + PrimeReact
- **Backend**: Node.js + Express
- **Base de Datos**: MongoDB + Mongoose
- **Autenticación**: JWT (JSON Web Tokens)

## 📁 Estructura del Proyecto

```
ProyectoFinal/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuraciones (DB, etc.)
│   │   ├── models/         # Modelos de Mongoose
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── routes/         # Definición de rutas
│   │   ├── middleware/     # Middleware (auth, validaciones)
│   │   └── utils/          # Utilidades y helpers
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   ├── pages/          # Páginas principales
    │   ├── services/       # Servicios API
    │   ├── context/        # Context API
    │   └── utils/          # Utilidades
    └── package.json
```

## 🚀 Inicio Rápido

### Backend

**Ver guía completa:** [backend/PRUEBAS.md](backend/PRUEBAS.md)

1. Instalar dependencias:

```bash
cd backend
npm install
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
# El archivo ya tiene valores por defecto funcionales
```

3. Poblar base de datos con datos de prueba:

```bash
npm run seed
```

Esto creará:

- 5 usuarios (admin, coordinador, 2 conductores, operador)
- 3 bodegas
- 6 productos
- 3 vehículos

4. Iniciar servidor:

```bash
npm run dev
```

5. Probar la API:

```bash
curl http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@logistica.com","password":"admin123"}'
```

### Credenciales de Prueba

| Rol         | Email                     | Password |
| ----------- | ------------------------- | -------- |
| Admin       | admin@logistica.com       | admin123 |
| Coordinador | coordinador@logistica.com | coord123 |
| Conductor   | conductor1@logistica.com  | cond123  |
| Operador    | operador@logistica.com    | oper123  |

---

## 📚 Documentación

### Backend

- **[PRUEBAS.md](backend/PRUEBAS.md)** - Guía completa para probar el sistema
- **[API_USUARIOS.md](backend/API_USUARIOS.md)** - Documentación de endpoints
- **[INICIO_RAPIDO.md](backend/INICIO_RAPIDO.md)** - Instalación y configuración
- **[ARQUITECTURA.md](backend/ARQUITECTURA.md)** - Diagramas y estructura
- **[RESUMEN_IMPLEMENTACION.md](backend/RESUMEN_IMPLEMENTACION.md)** - Checklist completo
- **[README.md](backend/README.md)** - Overview del backend

### API Endpoints (13 implementados)

**Autenticación** (`/api/auth`)

- `POST /login` - Iniciar sesión (público)
- `POST /registro` - Registrar usuario (admin)
- `GET /perfil` - Obtener perfil (privado)
- `PUT /perfil` - Actualizar perfil (privado)
- `PUT /cambiar-password` - Cambiar contraseña (privado)

**Gestión de Usuarios** (`/api/usuarios`)

- `GET /` - Listar usuarios (admin/coordinador)
- `POST /` - Crear usuario (admin)
- `GET /:id` - Ver usuario (privado)
- `PUT /:id` - Actualizar usuario (admin/propio)
- `DELETE /:id` - Eliminar usuario (admin)
- `GET /rol/:rol` - Usuarios por rol (admin/coordinador)
- `GET /conductores/disponibles` - Listar conductores (admin/coordinador)
- `PATCH /:id/estado` - Cambiar estado (admin)

---

## 🛠️ Herramientas de Testing

### Opción 1: REST Client (VS Code)

Abrir `backend/test.http` con la extensión REST Client

### Opción 2: Postman

Importar endpoints desde la documentación

### Opción 3: cURL

Ejemplos disponibles en [PRUEBAS.md](backend/PRUEBAS.md)

---

## 📝 Variables de Entorno

El archivo `.env.example` ya contiene valores por defecto funcionales:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/logistica_db
JWT_SECRET=tu_clave_secreta_super_segura_aqui_cambiar_en_produccion
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

## 👥 Roles de Usuario

- **Admin**: Acceso total al sistema
- **Coordinador**: Gestión de rutas y asignaciones
- **Conductor**: Visualización de rutas asignadas
- **Operador**: Gestión de inventario y bodegas

## 📄 Licencia

ISC
