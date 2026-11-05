# Manual técnico de StockPlus

Documento dirigido al equipo que mantiene o entrega StockPlus. Describe la arquitectura, la base de datos, las decisiones de seguridad, las pruebas y las tareas de mantenimiento.

## 1. Tecnologías

### Backend

| Componente | Versión / uso |
|---|---|
| Node.js | 22 o superior (24 LTS recomendado) |
| Express | 4.22 |
| PostgreSQL | 16 o superior, mediante `pg` |
| Autenticación | JWT con `jsonwebtoken`, expiración configurable |
| Contraseñas | `bcryptjs`, costo 12 |
| Seguridad HTTP | `helmet`, `cors`, `express-rate-limit` |
| Pruebas | Jest 30 + Supertest 7 |

### Frontend

| Componente | Versión / uso |
|---|---|
| React | 18 |
| React Router | 7 |
| Vite | 8 |
| Estilos | CSS propio con variables y diseño adaptable |
| Gráficas | Canvas nativo |
| Estado de sesión | Context API + `localStorage` |
| Tipografías | Plus Jakarta Sans y JetBrains Mono servidas localmente (`frontend/src/assets/fonts`) |

## 2. Arquitectura

```text
Navegador
   │
   │ HTTP http://localhost:5000
   ▼
Express (backend/src/app.js)
   ├── Trust proxy opcional, Helmet, CORS, rate limit, JSON 1 MB
   ├── /api/auth          login, registro, identidad, contraseña
   ├── /api/productos     inventario y stock
   ├── /api/clientes      clientes
   ├── /api/proveedores   proveedores
   ├── /api/ventas        ventas transaccionales
   ├── /api/dashboard     métricas agregadas
   ├── /api/ping          salud del servicio
   ├── /healthz           salud para balanceadores y monitoreo
   └── frontend/dist      aplicación React compilada + fallback SPA
   │
   ▼
Pool PostgreSQL (backend/src/config/db.js)
   │
   ▼
Base de datos stockplus
```

En producción local se sirve **todo desde un solo puerto** (`5000`): la API y la aplicación web compilada. En desarrollo, Vite sirve la web en `5173` y redirige `/api` al backend en `5000`.

## 3. Estructura de carpetas

```text
backend/
├── scripts/
│   ├── backup.js           Respaldo SQL con pg_dump y retención
│   ├── create-admin.js     Crea o promueve un administrador
│   ├── reset-password.js   Cambio de contraseña por terminal
│   └── setup-test-db.js    Crea y prepara stockplus_test
├── src/
│   ├── app.js              Configuración de Express y arranque
│   ├── config/db.js        Pool de PostgreSQL y helpers
│   ├── middleware/
│   │   ├── auth.js         Validación JWT y generación de tokens
│   │   └── roles.js        Autorización por rol
│   ├── routes/             Rutas de la API
│   └── utils/              Validaciones y manejo de errores
├── tests/                  Pruebas de integración con Supertest
└── .env.example            Plantilla de configuración

database/
├── schema.sql              Esquema idempotente
└── seed.sql                Datos de demostración idempotentes

deploy/
├── nginx.conf.example      Proxy inverso con HTTPS
└── stockplus.service       Servicio systemd de ejemplo

frontend/
└── src/
    ├── components/         Sidebar y elementos compartidos
    ├── context/            AuthContext
    ├── pages/              Landing, Login, Registro, Dashboard, CRUD
    └── services/api.js     Cliente HTTP

scripts/
├── lib.js                  Utilidades de instalación
├── setup.js                Instalador guiado
├── start.js                Arranque local
└── dev.js                  Arranque de desarrollo
```

## 4. Base de datos

### Tablas

#### `usuarios`

| Columna | Tipo | Notas |
|---|---|---|
| `id_usuario` | SERIAL | Clave primaria |
| `nombre` | VARCHAR(100) | Obligatorio |
| `correo` | VARCHAR(100) | Único, obligatorio, normalizado a minúsculas |
| `contrasena` | VARCHAR(255) | Hash bcrypt |
| `rol` | ENUM `rol_usuario` | `administrador` o `vendedor`; por defecto `vendedor` |
| `creado_en` | TIMESTAMPTZ | Fecha de creación |

#### `proveedores`

| Columna | Tipo | Notas |
|---|---|---|
| `id_proveedor` | SERIAL | Clave primaria |
| `nombre` | VARCHAR(100) | Obligatorio |
| `contacto` | VARCHAR(100) | Opcional |
| `telefono` | VARCHAR(20) | Opcional |
| `direccion` | VARCHAR(255) | Opcional |
| `creado_en` | TIMESTAMPTZ | Fecha de creación |

#### `productos`

| Columna | Tipo | Notas |
|---|---|---|
| `id_producto` | SERIAL | Clave primaria |
| `nombre` | VARCHAR(100) | Obligatorio |
| `descripcion` | TEXT | Opcional |
| `precio` | DECIMAL(12,2) | `CHECK (precio > 0)` |
| `cantidad_stock` | INT | `CHECK (cantidad_stock >= 0)` |
| `stock_minimo` | INT | `CHECK (stock_minimo >= 0)` |
| `id_proveedor` | INT | FK a `proveedores`, `ON DELETE RESTRICT` |
| `activo` | BOOLEAN | Borrado lógico; por defecto `true` |
| `creado_en` | TIMESTAMPTZ | Fecha de creación |

#### `clientes`

| Columna | Tipo | Notas |
|---|---|---|
| `id_cliente` | SERIAL | Clave primaria |
| `nombre` | VARCHAR(100) | Obligatorio |
| `correo` | VARCHAR(100) | Opcional |
| `telefono` | VARCHAR(20) | Opcional |
| `creado_en` | TIMESTAMPTZ | Fecha de creación |

#### `ventas`

| Columna | Tipo | Notas |
|---|---|---|
| `id_venta` | SERIAL | Clave primaria |
| `fecha` | TIMESTAMPTZ | Por defecto `CURRENT_TIMESTAMP` |
| `id_cliente` | INT | FK a `clientes`, `ON DELETE RESTRICT`; puede ser NULL |
| `total` | DECIMAL(12,2) | `CHECK (total >= 0)` |
| `id_usuario` | INT | FK a `usuarios`, `ON DELETE SET NULL` |

#### `detalle_venta`

| Columna | Tipo | Notas |
|---|---|---|
| `id_detalle` | SERIAL | Clave primaria |
| `id_venta` | INT | FK a `ventas`, `ON DELETE CASCADE` |
| `id_producto` | INT | FK a `productos`, `ON DELETE RESTRICT` |
| `cantidad` | INT | `CHECK (cantidad > 0)` |
| `precio_unitario` | DECIMAL(12,2) | `CHECK (precio_unitario > 0)` |
| `subtotal` | DECIMAL(14,2) | Columna generada: `cantidad * precio_unitario` |

### Relaciones

```text
proveedores 1 ─── N productos
clientes    1 ─── N ventas
usuarios    1 ─── N ventas
ventas      1 ─── N detalle_venta
productos   1 ─── N detalle_venta
```

### Reglas de integridad

- No se puede eliminar un cliente con ventas (`ON DELETE RESTRICT` y validación explícita con respuesta `409`).
- No se puede eliminar un proveedor con productos (`ON DELETE RESTRICT` y validación explícita con respuesta `409`).
- Los productos no se eliminan: se marca `activo = false` para conservar el historial.
- Cuando se elimina un usuario, sus ventas se conservan con `id_usuario = NULL`.
- El stock y el precio se validan con restricciones `CHECK`.
- El esquema es idempotente y puede ejecutarse varias veces.
- Antes de crear la restricción de stock, el esquema normaliza a `0` cualquier stock negativo heredado de versiones anteriores.

### Índices

Se indexan nombres y stock de productos, actividad, fechas de ventas, claves foráneas de ventas y detalle, y correos de usuarios y clientes.

## 5. Autenticación y autorización

### Flujo

1. `POST /api/auth/login` valida correo y contraseña con bcrypt.
2. Se genera un JWT con `{ id, nombre, rol }` y expiración (`JWT_EXPIRES_IN`, por defecto `8h`).
3. El frontend guarda token y usuario en `localStorage`.
4. Cada solicitud protegida envía `Authorization: Bearer <token>`.
5. `authMiddleware` verifica la firma y la expiración.
6. `requireRole('administrador')` protege las operaciones exclusivas.
7. Al cargar la aplicación, `AuthContext` consulta `/api/auth/me` para validar que el usuario siga existiendo y obtener su rol actual.
8. Ante un `401`, el cliente limpia la sesión y redirige al login, excepto en login/registro.

### Permisos del backend

| Recurso | Lectura | Escritura | Eliminación |
|---|---|---|---|
| Productos | Cualquier usuario autenticado | Solo administrador | Solo administrador (borrado lógico) |
| Clientes | Cualquier usuario autenticado | Cualquier usuario autenticado | Solo administrador |
| Proveedores | Cualquier usuario autenticado | Solo administrador | Solo administrador |
| Ventas | Cualquier usuario autenticado | Cualquier usuario autenticado | No disponible |
| Dashboard | Cualquier usuario autenticado | — | — |

La autorización se aplica en el servidor. Ocultar botones en la interfaz es solo una mejora de experiencia; no sustituye los controles del backend.

### Crear un administrador adicional

La aplicación no incluye un módulo de gestión de usuarios. Usa el script incluido:

```bash
npm run db:create-admin -- --email=nuevo.admin@ejemplo.com --password=ClaveSegura123 --nombre="Nuevo Admin"
```

El script crea la cuenta como administrador o promueve una cuenta existente. También se puede hacer por SQL:

```sql
UPDATE usuarios
SET rol = 'administrador'
WHERE correo = 'nuevo.admin@ejemplo.com';
```

La persona debe cerrar sesión e iniciar de nuevo para que el token incluya el rol actualizado.

## 6. Lógica de ventas

`POST /api/ventas` se ejecuta dentro de una transacción:

1. Valida que exista al menos una línea y que las cantidades sean enteros positivos.
2. Agrupa líneas repetidas del mismo producto.
3. Ordena los productos por ID.
4. Valida el cliente si se envió.
5. Para cada producto ejecuta `SELECT ... FOR UPDATE` (bloqueo en orden de ID para evitar interbloqueos).
6. Rechaza productos inexistentes, inactivos o con stock insuficiente.
7. Calcula el total con el **precio de la base de datos**, ignorando cualquier precio enviado por el cliente.
8. Inserta la venta y el detalle.
9. Descuenta el stock.
10. Confirma la transacción o hace `ROLLBACK` ante cualquier error.

Consecuencias:

- No es posible manipular precios desde el navegador.
- Dos ventas simultáneas no pueden dejar el stock negativo.
- Una venta fallida no deja registros parciales.

## 7. Seguridad

Medidas implementadas:

- Contraseñas con bcrypt (costo 12), nunca en texto plano.
- JWT firmado con secreto configurable. En `NODE_ENV=production` el secreto es obligatorio, debe tener al menos 32 caracteres y se rechazan valores de ejemplo o débiles al arrancar.
- `helmet` con Content Security Policy explícita. Las tipografías se sirven localmente y la política no incluye dominios externos. `upgrade-insecure-requests` está desactivado para que la aplicación funcione por HTTP en la red local.
- CORS restringido: mismo origen, orígenes configurados en `CORS_ORIGINS` y `localhost` en desarrollo.
- Rate limit: 20 intentos fallidos de login cada 15 minutos, 10 registros por hora y conexión, y un límite global configurable (`API_RATE_LIMIT_MAX`, por defecto 1000 solicitudes cada 15 minutos).
- Registro público desactivable con `ALLOW_REGISTRATION=false`.
- Límite de cuerpo JSON de 1 MB.
- Consultas SQL parametrizadas.
- Errores internos de PostgreSQL no se exponen al cliente.
- Validación y normalización de datos en el servidor.
- Borrado lógico de productos y restricciones de integridad.
- Cierre ordenado del servidor y del pool con `SIGINT`/`SIGTERM`.
- Conexión a PostgreSQL con SSL opcional (`PG_SSL`), útil con proveedores administrados.
- `trust proxy` configurable (`TRUST_PROXY`) para obtener la IP real detrás de Nginx.
- Endpoint de salud `/healthz` y `/api/ping` con verificación real de la base de datos.

Consideraciones para uso local:

- Por defecto la aplicación usa HTTP, adecuado para `localhost` o una red privada de confianza.
- Para acceso desde internet se debe usar un proxy inverso con HTTPS (ver [DESPLIEGUE.md](DESPLIEGUE.md)).
- El token se guarda en `localStorage`; la CSP y el escapado de React reducen el riesgo de XSS, pero no se debe inyectar HTML de terceros.
- No exponer el puerto `5000` directamente a internet sin HTTPS, proxy inverso y controles adicionales.
- Cambiar las contraseñas de demostración y el secreto JWT si el equipo se comparte.
- El archivo `backend/.env` contiene credenciales y está excluido de Git y del paquete de entrega.

## 8. Configuración

La configuración se carga desde `backend/.env` (ver la tabla en [INSTALACION_LOCAL.md](INSTALACION_LOCAL.md#5-configuración-archivo-backendenv)). El archivo `.env.example` sirve como plantilla.

Variables relevantes para el equipo técnico:

- `PG_*`: conexión a PostgreSQL local.
- `DATABASE_URL`: alternativa para PostgreSQL gestionado; si se define, reemplaza a `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD` y `PG_DB`.
- `PG_SSL` y `PG_SSL_REJECT_UNAUTHORIZED`: SSL para proveedores administrados.
- `PG_POOL_MAX`: tamaño máximo del pool (20 por defecto).
- `PG_STATEMENT_TIMEOUT_MS`: tiempo máximo por consulta (30 s por defecto).
- `PG_DB_TEST`: base exclusiva de pruebas. Nunca debe ser igual a `PG_DB`.
- `JWT_SECRET_KEY`: clave de firma. Generar con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `JWT_EXPIRES_IN`: duración del token.
- `PORT`: puerto del servidor.
- `NODE_ENV`: `development` o `production`. El arranque normal usa `production`.
- `TRUST_PROXY`: número de proxies de confianza o valor soportado por Express (`1` detrás de Nginx).
- `ALLOW_REGISTRATION`: `false` desactiva el registro público.
- `API_RATE_LIMIT_MAX`: límite global de solicitudes por IP cada 15 minutos.
- `CORS_ORIGINS`: orígenes adicionales permitidos, separados por coma.

La guía completa de despliegue, con ejemplos de Nginx, systemd, PM2 y NSSM, está en [DESPLIEGUE.md](DESPLIEGUE.md).

## 9. Scripts operativos

| Script | Uso |
|---|---|
| `npm run setup` | Instalación/actualización local completa |
| `npm start` | Arranque local en producción en un solo puerto |
| `npm run start:prod` | Arranque forzando `NODE_ENV=production` |
| `npm run dev` | Desarrollo con recarga |
| `npm run build` | Compilación del frontend |
| `npm run verify` | Pruebas + compilación |
| `npm test` | Pruebas del backend |
| `npm run test:coverage` | Cobertura |
| `npm run db:backup` | Respaldo SQL con retención |
| `npm run db:create-admin -- --email=... --password=...` | Crear o promover administrador |
| `npm run db:reset-password -- --email=...` | Cambio de contraseña |

El instalador:

- Crea `backend/.env` si no existe.
- Genera una clave JWT aleatoria si falta o es de ejemplo.
- Crea la base de datos si no existe.
- Aplica `database/schema.sql` y `database/seed.sql` dentro de una transacción.
- Omite la semilla si se define `STOCKPLUS_SKIP_SEED=1`.
- Instala dependencias solo si faltan.
- Compila el frontend.

Para producción existen además `ecosystem.config.cjs` (PM2) y los ejemplos de `deploy/`.

## 10. Pruebas

```bash
npm test
```

Características:

- Jest + Supertest contra la aplicación Express.
- Base de datos separada `stockplus_test`.
- `pretest` crea la base si no existe y aplica esquema y semilla.
- Ejecución secuencial (`--runInBand`) para evitar condiciones de carrera.
- Cierre del pool al finalizar, sin `--forceExit`.
- Cobertura mínima global: 50 % de sentencias, 40 % de ramas, 50 % de funciones y 50 % de líneas.

Áreas cubiertas:

- Registro, login, identidad, expiración de token y cambio de contraseña.
- CRUD de productos con permisos y borrado lógico.
- Clientes y proveedores, incluidas restricciones de eliminación.
- Ventas: precios del servidor, stock, productos ocultos, líneas duplicadas y transacciones.
- Dashboard: métricas, series de 7 días y 6 meses, exclusión de productos ocultos.
- Códigos `401`, `403`, `404`, `409` y validaciones `400`.

Las pruebas no deben ejecutarse contra la base de datos real. Verifica que `PG_DB_TEST` sea distinto de `PG_DB`.

## 11. Mantenimiento

### Respaldo y restauración

Ver [INSTALACION_LOCAL.md](INSTALACION_LOCAL.md#8-respaldos). El respaldo usa `pg_dump` y se guarda en `backups/`. Para restaurar, se recomienda una base vacía o recrear `stockplus`; el archivo generado no usa `--clean`.

### Actualización

1. Respaldo.
2. Conservar `backend/.env`.
3. Reemplazar el código.
4. `npm run setup`.
5. `npm run verify`.
6. Reiniciar el proceso (`npm start` o el servicio systemd/PM2).

Para producción con proxy inverso, actualización y rollback, consulta [DESPLIEGUE.md](DESPLIEGUE.md).

### Reinicio limpio de datos

Detener la aplicación, eliminar la base `stockplus` y ejecutar `npm run setup`. Esto borra todos los datos y vuelve a cargar la demostración.

### Cambio de puerto

Editar `PORT` en `backend/.env` y reiniciar. La aplicación quedará en `http://localhost:<puerto>`.

### Registro de actividad

En `development`, `db.js` registra cada consulta con su duración. En `production` no se registra el texto de las consultas. Los errores internos se registran en la consola del servidor.

## 12. Limitaciones conocidas

- Una sola empresa/instalación; no hay multiusuario multiempresa.
- No hay módulo de compras ni entradas de inventario separadas: el stock se ajusta editando el producto.
- Las ventas no se pueden editar ni anular desde la interfaz.
- No hay gestión de usuarios desde la interfaz; las cuentas nuevas son vendedores y la promoción es por SQL.
- La lista de ventas muestra las 100 más recientes en la interfaz (la API permite hasta 200).
- No hay facturación electrónica, pagos en línea, múltiples sucursales ni reportes exportables.
- El despliegue previsto es local, en red privada o, con proxy inverso y HTTPS, en internet (ver [DESPLIEGUE.md](DESPLIEGUE.md)).

Estas limitaciones están documentadas para evitar expectativas incorrectas en la entrega.

## 13. Verificación de entrega

Checklist técnico sugerido:

- [ ] `npm run setup` termina sin errores en una base limpia y en una base existente.
- [ ] `npm test` pasa completo y Jest finaliza sin `--forceExit`.
- [ ] `npm run build` genera `frontend/dist/index.html`.
- [ ] `npm start` sirve API y frontend en `http://localhost:5000`.
- [ ] `/api/ping` y `/healthz` responden con la base conectada.
- [ ] La aplicación carga por la IP de la red local sin errores de CSP ni de consola.
- [ ] Las tipografías se sirven localmente (sin solicitudes a Google Fonts).
- [ ] `npm run db:create-admin` crea un administrador.
- [ ] Login de administrador y vendedor funciona.
- [ ] Permisos de vendedor se aplican en el backend (`403`).
- [ ] Registro de venta descuenta stock y usa el precio de la base.
- [ ] Venta con stock insuficiente devuelve `409` y no deja registros.
- [ ] Detalle de venta muestra productos y subtotales.
- [ ] `npm run db:backup` genera un archivo restaurable.
- [ ] La documentación no contiene contraseñas reales ni secretos.
