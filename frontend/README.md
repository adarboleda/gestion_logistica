# Frontend - Plataforma de Gestión Logística

## 🚀 Tecnologías

- **Vite** - Build tool ultra rápido
- **React 18** - Framework frontend
- **PrimeReact** - Biblioteca de componentes UI
- **React Router v6** - Enrutamiento
- **Axios** - Cliente HTTP
- **Zustand** - Gestión de estado

## 📦 Instalación

```bash
cd frontend
npm install
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🎨 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx    # Layout principal con sidebar
│   │   │   └── AuthLayout.jsx    # Layout para login
│   │   ├── Navbar.jsx
│   │   └── Sidebar.jsx
│   ├── pages/             # Páginas/Vistas
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Productos.jsx
│   │   ├── Movimientos.jsx
│   │   ├── Usuarios.jsx
│   │   ├── Bodegas.jsx
│   │   ├── Vehiculos.jsx
│   │   ├── Rutas.jsx
│   │   └── NotFound.jsx
│   ├── services/          # API calls
│   │   ├── api.js        # Configuración axios
│   │   └── index.js      # Servicios organizados
│   ├── context/          # State management
│   │   └── authStore.js  # Zustand store para auth
│   ├── App.jsx           # Componente principal con rutas
│   └── main.jsx          # Entry point
├── .env                  # Variables de entorno
├── package.json
└── vite.config.js
```

## 🚀 Ejecutar Proyecto

### Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

### Build para producción

```bash
npm run build
```

## 🔐 Credenciales de Prueba

```
Admin:
Email: admin@logistica.com
Password: admin123

Operador:
Email: operador@logistica.com
Password: operador123
```

## 📱 Rutas Disponibles

### Públicas

- `/login` - Página de inicio de sesión

### Protegidas

- `/dashboard` - Panel principal
- `/productos` - Gestión de productos
- `/movimientos` - Movimientos de inventario
- `/usuarios` - Gestión de usuarios
- `/bodegas` - Gestión de bodegas
- `/vehiculos` - Gestión de vehículos
- `/rutas` - Gestión de rutas

## 🎨 Tema PrimeReact

El proyecto usa **Lara Light Indigo**. Para cambiar el tema, edita `src/main.jsx`
