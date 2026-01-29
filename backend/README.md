# Backend - Plataforma de Gestión de Logística

API REST desarrollada con Node.js, Express y MongoDB para la gestión integral de operaciones logísticas.

## 📋 Características

### Módulos Implementados

#### ✅ Módulo de Usuarios y Seguridad

- Autenticación con JWT
- Roles: Admin, Coordinador, Conductor, Operador
- Registro de usuarios (solo admin)
- Gestión de perfiles
- Control de acceso basado en roles (RBAC)
- Soft delete de usuarios
- Cambio de contraseñas

## 🛠️ Stack Tecnológico

- **Runtime:** Node.js v18+
- **Framework:** Express.js v4.18
- **Base de Datos:** MongoDB v6+ con Mongoose v8
- **Autenticación:** JWT (jsonwebtoken)
- **Seguridad:** bcryptjs para hash de passwords
- **CORS:** Configurado para frontend React
- **Validación:** express-validator

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración MongoDB
│   ├── models/
│   │   ├── Usuario.js           # Modelo de usuarios
│   │   ├── Bodega.js            # Modelo de bodegas
│   │   ├── Producto.js          # Modelo de productos
│   │   ├── Movimiento.js        # Modelo de movimientos
│   │   ├── Vehiculo.js          # Modelo de vehículos
│   │   ├── Ruta.js              # Modelo de rutas
│   │   └── index.js             # Exportador de modelos
│   ├── controllers/
│   │   ├── auth.controller.js   # Lógica de autenticación
│   │   └── usuario.controller.js # Lógica de usuarios
│   ├── routes/
│   │   ├── auth.routes.js       # Rutas de autenticación
│   │   └── usuario.routes.js    # Rutas de usuarios
│   ├── middleware/
│   │   ├── auth.middleware.js   # Verificación JWT
│   │   └── role.middleware.js   # Autorización por roles
│   └── utils/
│       ├── jwt.js               # Utilidades JWT
│       ├── crearAdmin.js        # Script crear admin
│       └── seedDatabase.js      # Script poblar DB
├── .env.example                 # Ejemplo variables de entorno
├── .gitignore
├── package.json
├── server.js                    # Punto de entrada
├── API_USUARIOS.md              # Documentación API
├── INICIO_RAPIDO.md             # Guía de inicio
└── test.http                    # Pruebas de endpoints
```

## 🚀 Inicio Rápido

### 1. Instalación

```bash
cd backend
npm install
```

### 2. Configuración

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Poblar Base de Datos

```bash
npm run seed
```

### 4. Iniciar Servidor

```bash
npm run dev
```

Ver [INICIO_RAPIDO.md](INICIO_RAPIDO.md) para instrucciones detalladas.

## 📚 Documentación

### API Endpoints

| Categoría    | Endpoint                                | Método | Acceso       |
| ------------ | --------------------------------------- | ------ | ------------ |
| **Auth**     | `/api/auth/login`                       | POST   | Público      |
| **Auth**     | `/api/auth/registro`                    | POST   | Admin        |
| **Auth**     | `/api/auth/perfil`                      | GET    | Privado      |
| **Auth**     | `/api/auth/perfil`                      | PUT    | Privado      |
| **Auth**     | `/api/auth/cambiar-password`            | PUT    | Privado      |
| **Usuarios** | `/api/usuarios`                         | GET    | Admin/Coord  |
| **Usuarios** | `/api/usuarios`                         | POST   | Admin        |
| **Usuarios** | `/api/usuarios/:id`                     | GET    | Privado      |
| **Usuarios** | `/api/usuarios/:id`                     | PUT    | Admin/Propio |
| **Usuarios** | `/api/usuarios/:id`                     | DELETE | Admin        |
| **Usuarios** | `/api/usuarios/rol/:rol`                | GET    | Admin/Coord  |
| **Usuarios** | `/api/usuarios/conductores/disponibles` | GET    | Admin/Coord  |
| **Usuarios** | `/api/usuarios/:id/estado`              | PATCH  | Admin        |

Ver [API_USUARIOS.md](API_USUARIOS.md) para documentación completa.

## 🔐 Sistema de Roles

### Admin

- ✅ Acceso total al sistema
- ✅ Crear, editar, eliminar usuarios
- ✅ Cambiar roles y estados
- ✅ Acceso a todos los módulos

### Coordinador

- ✅ Gestión de rutas y asignaciones
- ✅ Lectura de usuarios
- ✅ Asignación de vehículos y conductores
- ⛔ No puede modificar usuarios

### Conductor

- ✅ Ver rutas asignadas
- ✅ Actualizar estado de entregas
- ✅ Editar su propio perfil
- ⛔ Acceso limitado

### Operador

- ✅ Gestión de inventario
- ✅ Gestión de bodegas
- ✅ Movimientos de stock
- ⛔ No acceso a rutas

## 🔒 Seguridad

### Autenticación

- Tokens JWT con expiración configurable
- Hash de contraseñas con bcrypt (10 rounds)
- Validación de credenciales

### Autorización

- Middleware de verificación de roles
- Protección de rutas sensibles
- Validación de permisos por endpoint

### Mejores Prácticas

- Passwords nunca se retornan en respuestas
- Soft delete en lugar de eliminación física
- Validación de datos de entrada
- Manejo centralizado de errores

## 🧪 Testing

### Con archivo test.http (REST Client)

```bash
# Instalar extensión REST Client en VS Code
# Abrir test.http y ejecutar requests
```

### Con cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@logistica.com","password":"admin123"}'

# Obtener usuarios
curl -X GET http://localhost:5000/api/usuarios \
  -H "Authorization: Bearer TU_TOKEN"
```

### Con Postman

1. Importar colección desde `API_USUARIOS.md`
2. Configurar variable `baseUrl`: `http://localhost:5000`
3. Hacer login y copiar token
4. Configurar variable `token` con el token recibido

## 📊 Modelos de Datos

### Usuario

```javascript
{
  nombre: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  rol: Enum ['admin', 'coordinador', 'conductor', 'operador'],
  telefono: String,
  activo: Boolean
}
```

### Bodega

```javascript
{
  nombre: String (unique, required),
  direccion: {
    calle: String,
    ciudad: String,
    estado: String,
    codigoPostal: String,
    coordenadas: { latitud, longitud }
  },
  estado: Enum ['activa', 'inactiva'],
  capacidadMaxima: Number
}
```

### Producto

```javascript
{
  nombre: String (required),
  codigo: String (unique, required),
  stock_actual: Number,
  stock_minimo: Number,
  precio: Number,
  bodega: ObjectId (ref: Bodega),
  categoria: Enum,
  activo: Boolean
}
```

Ver modelos completos en `src/models/`

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor producción
npm run dev        # Iniciar servidor desarrollo (nodemon)
npm run seed       # Poblar base de datos con datos de prueba
npm run crear-admin # Crear usuario administrador
```

## 🌐 Variables de Entorno

```env
PORT=5000                          # Puerto del servidor
NODE_ENV=development               # Entorno (development/production)
MONGODB_URI=mongodb://...          # URI de MongoDB
JWT_SECRET=clave_secreta           # Clave para firmar JWT
JWT_EXPIRE=7d                      # Tiempo de expiración del token
FRONTEND_URL=http://localhost:3000 # URL del frontend para CORS
```

## 📝 Convenciones de Código

### Respuestas de API

Todas las respuestas siguen el formato:

```javascript
// Éxito
{
  success: true,
  message: "Mensaje descriptivo",
  data: { ... }
}

// Error
{
  success: false,
  message: "Descripción del error",
  error: "Detalles (solo en desarrollo)"
}
```

### Códigos HTTP

- `200` OK - Operación exitosa
- `201` Created - Recurso creado
- `400` Bad Request - Datos inválidos
- `401` Unauthorized - No autenticado
- `403` Forbidden - Sin permisos
- `404` Not Found - Recurso no encontrado
- `500` Server Error - Error del servidor

## 🐛 Debugging

### Logs del Servidor

El servidor muestra logs en consola:

```
✅ MongoDB conectado: localhost
📊 Base de datos: logistica_db
🚀 Servidor corriendo en puerto 5000
🌍 Entorno: development
```

### Errores Comunes

Ver [INICIO_RAPIDO.md - Solución de Problemas](INICIO_RAPIDO.md#-solución-de-problemas)

## 📈 Próximas Implementaciones

- [ ] Controllers y Routes para Bodegas
- [ ] Controllers y Routes para Productos
- [ ] Controllers y Routes para Movimientos (con actualización automática de stock)
- [ ] Controllers y Routes para Vehículos
- [ ] Controllers y Routes para Rutas
- [ ] Middleware de validación con express-validator
- [ ] Rate limiting para prevenir ataques
- [ ] Logging con winston
- [ ] Tests unitarios con Jest
- [ ] Documentación con Swagger/OpenAPI

## 🤝 Contribución

1. Seguir la estructura de carpetas establecida
2. Documentar nuevos endpoints en `API_*.md`
3. Mantener convenciones de respuestas
4. Implementar validaciones apropiadas
5. Actualizar este README

## 📄 Licencia

ISC

---

**Desarrollado para Proyecto Final - Desarrollo Web Avanzado**
