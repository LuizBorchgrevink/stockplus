# 📦 StockPlus — Guía de Instalación Completa
### Paso a paso para Visual Studio Code (Principiante)

---

## ✅ Requisitos previos

Antes de empezar, necesitas instalar estos programas en tu computadora:

| Programa | Para qué sirve | Descarga |
|----------|---------------|----------|
| **Node.js** (v18+) | Ejecutar el frontend React | https://nodejs.org → elige "LTS" |
| **Python** (v3.10+) | Ejecutar el backend Flask | https://python.org/downloads |
| **MySQL Community** | Base de datos | https://dev.mysql.com/downloads/mysql/ |
| **VS Code** | Editor de código | https://code.visualstudio.com |
| **Git** (opcional) | Control de versiones | https://git-scm.com |

> 💡 **Cómo verificar que están instalados:** abre una terminal y escribe:
> ```
> node --version      → debe mostrar: v18.x.x
> python --version    → debe mostrar: Python 3.x.x
> mysql --version     → debe mostrar: mysql  Ver 8.x
> ```

---

## 📁 PASO 1 — Abrir el proyecto en VS Code

1. Abre **Visual Studio Code**
2. Ve a **Archivo → Abrir Carpeta**
3. Selecciona la carpeta `stockplus` que descargaste
4. VS Code mostrará la estructura del proyecto en el panel izquierdo

> 💡 **Instala estas extensiones de VS Code** (opcionales pero útiles):
> - Python (de Microsoft)
> - ES7+ React/Redux/React-Native snippets
> - MySQL (de cweijan)

---

## 🗄️ PASO 2 — Configurar la Base de Datos MySQL

### 2.1 Iniciar MySQL

**En Windows:**
- Abre el programa "MySQL Workbench" o "MySQL Command Line Client"
- O desde servicios de Windows, inicia el servicio MySQL

**En Mac:**
```bash
brew services start mysql
```

**En Linux:**
```bash
sudo systemctl start mysql
```

### 2.2 Crear la base de datos

Abre una terminal en VS Code (`Terminal → Nueva Terminal`) y escribe:

```bash
mysql -u root -p
```

Te pedirá tu contraseña de MySQL. Escríbela y presiona Enter.

Una vez dentro del cliente MySQL, ejecuta:

```sql
SOURCE database/schema.sql;
```

O puedes ejecutarlo así desde la terminal de VS Code:

```bash
mysql -u root -p < database/schema.sql
```

✅ Esto creará:
- La base de datos `stockplus`
- Todas las tablas (usuarios, productos, clientes, proveedores, ventas, detalle_venta)
- Datos de prueba para que puedas probar de inmediato

---

## ⚙️ PASO 3 — Configurar el Backend (Flask)

### 3.1 Abrir una terminal para el backend

En VS Code, abre una nueva terminal (`Terminal → Nueva Terminal`) y navega a la carpeta backend:

```bash
cd backend
```

### 3.2 Crear un entorno virtual de Python

Un entorno virtual es como una "burbuja" donde instalas las librerías del proyecto sin afectar tu Python global.

```bash
# Crear el entorno virtual
python -m venv venv
```

### 3.3 Activar el entorno virtual

**En Windows:**
```bash
venv\Scripts\activate
```

**En Mac / Linux:**
```bash
source venv/bin/activate
```

✅ Sabrás que está activo porque verás `(venv)` al inicio de la línea en la terminal.

### 3.4 Instalar las dependencias

```bash
pip install -r requirements.txt
```

Esto instalará: Flask, Flask-CORS, Flask-JWT-Extended, mysql-connector-python, bcrypt, python-dotenv.

### 3.5 Configurar las variables de entorno

Abre el archivo `backend/.env` en VS Code y cambia la contraseña de MySQL:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=TU_CONTRASEÑA_AQUI   ← cambia esto
MYSQL_DB=stockplus
JWT_SECRET_KEY=stockplus-clave-secreta-2024
```

> 💡 Si tu MySQL no tiene contraseña, deja `MYSQL_PASSWORD=` vacío.

### 3.6 Iniciar el servidor Flask

```bash
python app.py
```

✅ Debes ver algo así:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

🎉 El backend está corriendo. **Deja esta terminal abierta.**

---

## 🎨 PASO 4 — Configurar el Frontend (React)

### 4.1 Abrir UNA SEGUNDA terminal

En VS Code, abre otra terminal nueva (el ícono `+` en la barra de terminales) y navega a la carpeta frontend:

```bash
cd frontend
```

### 4.2 Instalar las dependencias de Node.js

```bash
npm install
```

Esto descargará React, React Router y todas las librerías necesarias. Puede tardar 1-2 minutos.

### 4.3 Iniciar el servidor de desarrollo

```bash
npm run dev
```

✅ Debes ver algo así:
```
  VITE v5.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

🎉 El frontend está corriendo. **Deja esta terminal abierta también.**

---

## 🚀 PASO 5 — Abrir el sistema en el navegador

1. Abre tu navegador (Chrome, Firefox, Edge)
2. Ve a: **http://localhost:5173**
3. ¡Deberías ver la Landing Page de StockPlus!

### Credenciales de prueba:
| Campo | Valor |
|-------|-------|
| Email | admin@stockplus.com |
| Contraseña | password123 |

---

## 🗂️ Estructura del proyecto explicada

```
stockplus/
│
├── 📁 backend/              ← Servidor Flask (Python)
│   ├── app.py               ← Punto de entrada del servidor
│   ├── requirements.txt     ← Librerías Python necesarias
│   ├── .env                 ← Variables secretas (contraseñas)
│   ├── 📁 models/
│   │   └── db.py            ← Conexión a MySQL
│   └── 📁 routes/
│       ├── auth_routes.py   ← Login y registro
│       ├── producto_routes.py
│       ├── cliente_routes.py
│       ├── proveedor_routes.py
│       ├── venta_routes.py
│       └── dashboard_routes.py
│
├── 📁 frontend/             ← Aplicación React (JavaScript)
│   ├── index.html           ← HTML base
│   ├── package.json         ← Dependencias Node.js
│   ├── vite.config.js       ← Configuración del bundler
│   └── 📁 src/
│       ├── main.jsx         ← Punto de entrada React
│       ├── App.jsx          ← Rutas de la aplicación
│       ├── index.css        ← Estilos globales
│       ├── 📁 context/
│       │   └── AuthContext.jsx  ← Manejo de sesión
│       ├── 📁 services/
│       │   └── api.js       ← Llamadas al backend
│       ├── 📁 components/
│       │   └── Sidebar.jsx  ← Menú lateral
│       └── 📁 pages/
│           ├── Landing.jsx  ← Página principal
│           ├── Login.jsx    ← Inicio de sesión
│           ├── Register.jsx ← Registro de usuario
│           ├── Dashboard.jsx← Panel principal
│           ├── Inventario.jsx
│           ├── Ventas.jsx
│           ├── Clientes.jsx
│           └── Proveedores.jsx
│
└── 📁 database/
    └── schema.sql           ← Script para crear la BD
```

---

## 🔌 Cómo funciona la comunicación

```
Navegador (localhost:5173)
         ↕  HTTP / JSON
   Flask (localhost:5000)
         ↕  SQL
      MySQL (localhost:3306)
```

1. El usuario abre el navegador en el puerto 5173
2. React hace peticiones HTTP al backend en el puerto 5000
3. Flask procesa la petición y consulta MySQL
4. MySQL devuelve datos → Flask los envía como JSON → React los muestra

---

## ❓ Solución de problemas frecuentes

### ❌ "No se pudo conectar al servidor"
- Verifica que el backend Flask esté corriendo en la segunda terminal
- Comprueba que el archivo `.env` tenga la contraseña correcta de MySQL
- Asegúrate de que MySQL esté iniciado

### ❌ "Error 1045: Access denied for user 'root'"
- La contraseña en `.env` no coincide con la de MySQL
- Ábrela y corrígela: `MYSQL_PASSWORD=tu_contraseña`

### ❌ "Cannot find module" en npm
- Ejecuta `npm install` nuevamente en la carpeta `frontend`

### ❌ "ModuleNotFoundError" en Python
- Asegúrate de que el entorno virtual esté activado (debe verse `(venv)`)
- Ejecuta `pip install -r requirements.txt` nuevamente

### ❌ La página se ve en blanco
- Abre las herramientas de desarrollador del navegador (F12)
- Revisa la pestaña "Console" para ver el error exacto

---

## 🎯 Funcionalidades implementadas

| Módulo | Función | Estado |
|--------|---------|--------|
| Landing Page | Presentación del sistema | ✅ |
| Login | Autenticación con JWT | ✅ |
| Registro | Crear cuenta nueva | ✅ |
| Dashboard | Estadísticas y gráficas | ✅ |
| Inventario | CRUD completo de productos | ✅ |
| Ventas | Registrar ventas + reducción de stock automática | ✅ |
| Clientes | CRUD completo | ✅ |
| Proveedores | CRUD completo | ✅ |
| Alertas stock bajo | Visible en Dashboard | ✅ |
| Roles (Admin/Vendedor) | Guardados en JWT | ✅ |

---

## 📋 Reglas de negocio implementadas

1. ✅ No se puede vender si no hay stock
2. ✅ El stock se reduce automáticamente al registrar una venta
3. ✅ Cada venta debe tener al menos un producto
4. ✅ El total se calcula automáticamente (cantidad × precio)
5. ✅ Los productos deben tener precio mayor a cero

---

## 🔐 Seguridad implementada

- Contraseñas encriptadas con **bcrypt** (nunca se guardan en texto plano)
- Autenticación con **JWT** (tokens de sesión seguros)
- Rutas del backend protegidas (requieren token válido)
- CORS configurado para solo aceptar peticiones del frontend

---

*StockPlus v1.0 — Sistema de gestión de inventario para pequeños negocios*
