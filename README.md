# StockPlus

Sistema de gestión de inventario para pequeños negocios. Permite controlar productos, ventas, clientes y proveedores desde una aplicación web que se ejecuta **en tu propio computador**, sin servicios en la nube ni dependencias externas.

## Contenido del sistema

- **Dashboard** con indicadores reales de inventario, ventas, clientes y productos por reponer.
- **Inventario** con búsqueda, stock mínimo, alertas y borrado lógico (ocultar/restaurar).
- **Ventas** con carrito de varios productos, control de stock y precio tomado automáticamente del inventario.
- **Clientes** con historial protegido: no se pueden borrar clientes con ventas registradas.
- **Proveedores** asociados a productos, con protección al eliminar.
- **Usuarios y roles**: administrador y vendedor, con permisos diferenciados.
- **Diseño adaptable** a computador, tableta y celular, con modo oscuro en el dashboard.

## Requisitos

Solo se necesitan dos programas estándar:

| Programa | Versión | Para qué |
|---|---|---|
| Node.js | 22 o superior (se recomienda 24 LTS) | Ejecutar el servidor y la aplicación web |
| PostgreSQL | 16 o superior (probado con 17) | Guardar los datos del negocio |
| Navegador web | Chrome, Edge, Firefox o Safari actualizado | Usar la aplicación |

No se necesita Docker, Python, Java, cuentas en la nube ni servidores externos.

## Inicio rápido

### Windows

1. Instala Node.js LTS y PostgreSQL siguiendo la [guía de instalación](docs/INSTALACION_LOCAL.md).
2. Descomprime la carpeta del proyecto en una ubicación local, por ejemplo `C:\StockPlus`. Evita `Program Files` y carpetas sincronizadas con OneDrive.
3. Haz doble clic en **`SETUP.bat`**. Solo se ejecuta la primera vez.
4. Haz doble clic en **`INICIAR.bat`**. Se abrirá el navegador en `http://localhost:5000`.

### Linux o macOS

```bash
bash setup.sh
bash iniciar.sh
```

### Cualquier sistema con npm

```bash
npm run setup
npm start
```

`npm run setup` instala las dependencias, crea la base de datos, carga los datos de demostración y compila la aplicación web. `npm start` inicia la aplicación en `http://localhost:5000`.

### Acceso desde otros equipos de la red

Al arrancar, la consola muestra una dirección como `http://192.168.1.9:5000`. Esa es la URL que deben abrir los demás equipos de la red local. Si no conecta, permite el puerto en el firewall del equipo servidor (Windows suele preguntarlo la primera vez).

Para publicar el sistema en internet, con HTTPS y arranque automático, sigue la [guía de despliegue](docs/DESPLIEGUE.md).

## Modo producción

`npm start` y `npm run start:prod` arrancan con `NODE_ENV=production`:

- El secreto JWT debe tener al menos 32 caracteres y no puede ser un valor de ejemplo.
- Las fuentes se sirven localmente; no se hacen solicitudes a Google Fonts.
- El registro público se puede desactivar con `ALLOW_REGISTRATION=false`; en ese caso los administradores crean las cuentas desde la terminal.
- Los límites de peticiones y los errores internos quedan controlados por el servidor y el proxy inverso.

## Credenciales de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@stockplus.com` | `password123` |
| Vendedor | `vendedor@stockplus.com` | `password123` |

> **Importante:** cambia la contraseña del administrador antes de usar el sistema con datos reales. Puedes hacerlo desde el menú lateral, opción **Cambiar contraseña**.

## Documentación

| Documento | Contenido |
|---|---|
| [Instalación local](docs/INSTALACION_LOCAL.md) | Requisitos, instalación paso a paso, respaldos, restauración y solución de problemas |
| [Manual de usuario](docs/MANUAL_USUARIO.md) | Uso diario del sistema, roles, módulos y preguntas frecuentes |
| [Manual técnico](docs/MANUAL_TECNICO.md) | Arquitectura, base de datos, seguridad, pruebas y mantenimiento |
| [Guía de despliegue](docs/DESPLIEGUE.md) | Puesta en producción en un equipo, red local o internet con HTTPS, PM2/systemd y Nginx |
| [API](docs/API.md) | Endpoints, permisos, ejemplos de solicitudes y respuestas |

## Comandos disponibles

Ejecuta estos comandos desde la carpeta raíz del proyecto:

| Comando | Función |
|---|---|
| `npm run setup` | Instalación completa (dependencias, base de datos, datos demo y compilación) |
| `npm start` | Inicia la aplicación en modo producción en `http://localhost:5000` y muestra la URL de la red local |
| `npm run start:prod` | Igual que `npm start`, forzando `NODE_ENV=production` |
| `npm run dev` | Modo desarrollo: API en `:5000` y web con recarga en `:5173` |
| `npm run build` | Compila la aplicación web en `frontend/dist` |
| `npm run verify` | Ejecuta las pruebas del backend y la compilación del frontend |
| `npm test` | Ejecuta las pruebas automatizadas del backend |
| `npm run test:coverage` | Ejecuta las pruebas y genera el reporte de cobertura |
| `npm run db:backup` | Genera un respaldo SQL en la carpeta `backups/` (retención configurable) |
| `npm run db:create-admin -- --email=... --password=... --nombre=...` | Crea un administrador o promueve una cuenta existente |
| `npm run db:reset-password -- --email=admin@stockplus.com` | Restablece una contraseña desde la terminal |

## Estructura del proyecto

```text
stockplus/
├── backend/            API REST con Node.js, Express y PostgreSQL
│   ├── scripts/        Utilidades de respaldo, pruebas y contraseñas
│   ├── src/            Rutas, middleware y configuración
│   └── tests/          Pruebas automatizadas
├── database/           Esquema y datos de demostración
├── deploy/             Ejemplos de Nginx y systemd para producción
├── docs/               Documentación para el cliente y el equipo técnico
├── frontend/           Aplicación web con React y Vite
├── scripts/            Asistentes de instalación y arranque
├── SETUP.bat           Instalación en Windows
├── INICIAR.bat         Arranque en Windows
├── setup.sh            Instalación en Linux/macOS
└── iniciar.sh          Arranque en Linux/macOS
```

## Pruebas automatizadas

```bash
npm test
```

Las pruebas usan una base de datos separada llamada `stockplus_test`, creada automáticamente en el mismo PostgreSQL. No modifican la base de datos real del negocio.

## Alcance y limitaciones

StockPlus está diseñado para ejecutarse en un solo computador o en la red local de un pequeño negocio. También puede publicarse en internet con un proxy inverso y HTTPS siguiendo la [guía de despliegue](docs/DESPLIEGUE.md). No incluye facturación electrónica, pasarela de pagos, múltiples sucursales ni acceso desde internet sin proxy. Las ventas registradas no se pueden editar ni anular desde la interfaz; si necesitas corregir stock, un administrador puede hacerlo desde **Inventario > Editar**.

Para uso con datos reales se recomienda:

- Cambiar las contraseñas de demostración.
- Programar respaldos periódicos con `npm run db:backup`.
- Mantener el equipo y PostgreSQL actualizados.
- No exponer el puerto `5000` directamente a internet.
