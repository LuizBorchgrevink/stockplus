# API de StockPlus

API REST del sistema de inventario. Todos los endpoints devuelven JSON y, salvo el estado del servicio, el login y el registro, requieren un token JWT.

## 1. Dirección base

```text
http://localhost:5000/api
```

Si cambiaste `PORT` en `backend/.env`, ajusta el puerto. En modo desarrollo también puedes usar el proxy de Vite en `http://localhost:5173/api`.

## 2. Autenticación

1. Obtén un token con `POST /api/auth/login`.
2. Envía el token en cada solicitud protegida:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

El token expira según `JWT_EXPIRES_IN` (por defecto 8 horas). El rol incluido en el token se valida contra la base de datos al iniciar la aplicación mediante `/api/auth/me`; si el usuario cambia de rol, debe volver a iniciar sesión.

### Roles

| Rol | Alcance |
|---|---|
| `administrador` | Acceso completo, incluidas operaciones de productos, proveedores y eliminación de clientes |
| `vendedor` | Consulta general, registro de ventas y gestión de clientes sin eliminación |

## 3. Formato de errores

Los errores tienen la forma:

```json
{ "error": "Descripción del problema" }
```

| Código | Significado |
|---|---|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `400` | Datos inválidos o solicitud incorrecta |
| `401` | Token ausente, inválido o expirado; credenciales incorrectas |
| `403` | El rol no tiene permisos |
| `404` | Recurso no encontrado |
| `409` | Conflicto: duplicado, stock insuficiente o registro relacionado |
| `413` | Cuerpo de solicitud demasiado grande (máximo 1 MB) |
| `429` | Límite de intentos excedido |
| `500` | Error interno |
| `503` | Base de datos no disponible |

Las fechas se devuelven en formato ISO 8601 (`2026-11-02T16:24:19.000Z`). Los montos son números en pesos colombianos (COP), sin formato.

## 4. Estado del servicio

### `GET /api/ping`

Público. Comprueba que Express y PostgreSQL respondan.

**Respuesta `200`:**

```json
{
  "status": "ok",
  "db": "conectada",
  "servicio": "StockPlus API"
}
```

**Respuesta `503`:**

```json
{
  "status": "error",
  "db": "desconectada",
  "error": "No se pudo conectar a PostgreSQL. Verifica que el servicio este iniciado y que backend/.env tenga las credenciales correctas."
}
```

## 5. Autenticación

### `POST /api/auth/register`

Público. Crea un usuario con rol `vendedor`.

**Cuerpo:**

```json
{
  "nombre": "María Gómez",
  "correo": "maria@ejemplo.com",
  "contrasena": "ClaveSegura123"
}
```

Reglas:

- `nombre`: obligatorio, máximo 100 caracteres.
- `correo`: obligatorio, formato válido, máximo 100 caracteres; se convierte a minúsculas.
- `contrasena`: obligatoria, entre 8 y 72 caracteres.

**Respuesta `201`:**

```json
{
  "mensaje": "Usuario registrado exitosamente",
  "id": 8
}
```

Errores: `400` por validación, `409` si el correo ya existe.

### `POST /api/auth/login`

Público. Límite: 20 intentos fallidos cada 15 minutos por conexión.

**Cuerpo:**

```json
{
  "correo": "admin@stockplus.com",
  "contrasena": "password123"
}
```

**Respuesta `200`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": {
    "id": 1,
    "nombre": "Admin Principal",
    "correo": "admin@stockplus.com",
    "rol": "administrador"
  }
}
```

Errores: `400` si faltan datos, `401` con `Credenciales incorrectas`, `429` si se supera el límite.

### `GET /api/auth/me`

Requiere token. Devuelve la identidad actual consultada en la base de datos.

**Respuesta `200`:**

```json
{
  "id": 1,
  "nombre": "Admin Principal",
  "correo": "admin@stockplus.com",
  "rol": "administrador"
}
```

Errores: `401`.

### `PUT /api/auth/password`

Requiere token. Cambia la contraseña del usuario autenticado.

**Cuerpo:**

```json
{
  "actual": "password123",
  "nueva": "NuevaClave456"
}
```

Reglas: la nueva contraseña debe tener entre 8 y 72 caracteres y ser diferente a la actual.

**Respuesta `200`:**

```json
{ "mensaje": "Contrasena actualizada correctamente" }
```

Errores: `400` si la contraseña actual no coincide o la nueva no cumple las reglas, `401`.

## 6. Productos

Todos los endpoints requieren token.

### `GET /api/productos`

Lista productos activos.

**Parámetros de consulta:**

| Parámetro | Descripción |
|---|---|
| `buscar` | Filtra por nombre (ILIKE, insensible a mayúsculas) |
| `todos=true` | Incluye productos ocultos |

**Respuesta `200`:** arreglo de productos. Cada elemento incluye los campos de la tabla `productos` y `proveedor_nombre` (o `null`).

```json
[
  {
    "id_producto": 2,
    "nombre": "Mouse Inalambrico",
    "descripcion": "Mouse ergonomico 2.4GHz",
    "precio": "45000.00",
    "cantidad_stock": 50,
    "stock_minimo": 10,
    "id_proveedor": 1,
    "activo": true,
    "creado_en": "2026-03-01T12:00:00.000Z",
    "proveedor_nombre": "Distribuidora ABC"
  }
]
```

### `GET /api/productos/stock-bajo`

Devuelve los productos activos cuyo stock es menor o igual al stock mínimo.

**Respuesta `200`:** arreglo de productos.

### `GET /api/productos/:id`

Devuelve un producto por ID. Errores: `400` ID inválido, `404` no encontrado.

### `POST /api/productos` (solo administrador)

**Cuerpo:**

```json
{
  "nombre": "Teclado Mecánico",
  "descripcion": "Teclado RGB",
  "precio": 180000,
  "cantidad_stock": 25,
  "stock_minimo": 5,
  "id_proveedor": 2
}
```

Reglas: nombre obligatorio (máx. 100), descripción máx. 2000, precio mayor que cero, stock y stock mínimo enteros no negativos. `id_proveedor` es opcional, pero si se envía debe existir.

**Respuesta `201`:**

```json
{ "mensaje": "Producto creado", "id": 15 }
```

Errores: `400`, `401`, `403`.

### `PUT /api/productos/:id` (solo administrador)

Mismos campos que `POST`. **Respuesta `200`:** `{ "mensaje": "Producto actualizado" }`. Errores: `400`, `403`, `404`.

### `DELETE /api/productos/:id` (solo administrador)

No elimina físicamente: marca `activo = false`. El producto deja de aparecer en ventas y en el listado por defecto.

**Respuesta `200`:** `{ "mensaje": "Producto ocultado del inventario" }`. Errores: `403`, `404`.

### `POST /api/productos/:id/restaurar` (solo administrador)

Vuelve a marcar el producto como activo.

**Respuesta `200`:** `{ "mensaje": "Producto restaurado al inventario" }`.

## 7. Clientes

Todos los endpoints requieren token.

### `GET /api/clientes?buscar=texto`

Busca por nombre, correo o teléfono. Devuelve hasta 500 registros ordenados por nombre.

**Respuesta `200`:**

```json
[
  {
    "id_cliente": 1,
    "nombre": "Juan Perez",
    "correo": "juan@email.com",
    "telefono": "3001111111",
    "creado_en": "2026-03-01T12:00:00.000Z"
  }
]
```

### `GET /api/clientes/:id`

Devuelve un cliente. Errores: `400`, `404`.

### `POST /api/clientes`

**Cuerpo:**

```json
{
  "nombre": "Ana Martínez",
  "correo": "ana@ejemplo.com",
  "telefono": "300 222 3333"
}
```

Reglas: nombre obligatorio (máx. 100); correo opcional con formato válido; teléfono opcional, máx. 20 caracteres y solo números, espacios, `+`, `-`, paréntesis.

**Respuesta `201`:**

```json
{ "mensaje": "Cliente creado", "id": 4 }
```

### `PUT /api/clientes/:id`

Mismos campos que `POST`. **Respuesta `200`:** `{ "mensaje": "Cliente actualizado" }`.

### `DELETE /api/clientes/:id` (solo administrador)

Elimina un cliente solo si no tiene ventas.

**Respuesta `200`:** `{ "mensaje": "Cliente eliminado" }`.

Errores:

- `403`: rol vendedor.
- `404`: cliente inexistente.
- `409`: `No se puede eliminar el cliente porque tiene ventas registradas. Conserva el historial.`

## 8. Proveedores

Todos los endpoints requieren token.

### `GET /api/proveedores?buscar=texto`

Busca por nombre, contacto o teléfono. Devuelve hasta 500 registros.

### `GET /api/proveedores/:id`

Devuelve un proveedor. Errores: `400`, `404`.

### `POST /api/proveedores` (solo administrador)

**Cuerpo:**

```json
{
  "nombre": "Distribuidora ABC",
  "contacto": "Carlos López",
  "telefono": "3001234567",
  "direccion": "Calle 10 #45-20, Bogotá"
}
```

**Respuesta `201`:** `{ "mensaje": "Proveedor creado", "id": 3 }`.

### `PUT /api/proveedores/:id` (solo administrador)

Mismos campos. **Respuesta `200`:** `{ "mensaje": "Proveedor actualizado" }`.

### `DELETE /api/proveedores/:id` (solo administrador)

Solo si no tiene productos asociados.

**Respuesta `200`:** `{ "mensaje": "Proveedor eliminado" }`.

Errores:

- `403`: rol vendedor.
- `404`: proveedor inexistente.
- `409`: `No se puede eliminar el proveedor porque tiene productos asociados.`

## 9. Ventas

Todos los endpoints requieren token. Puede registrar ventas cualquier usuario autenticado.

### `GET /api/ventas?limite=50`

Lista las ventas más recientes. `limite` es opcional; por defecto 50 y máximo 200.

**Respuesta `200`:**

```json
[
  {
    "id_venta": 29,
    "fecha": "2026-11-02T21:24:19.000Z",
    "id_cliente": null,
    "total": "540000.00",
    "id_usuario": 1,
    "cliente_nombre": null,
    "vendedor_nombre": "Admin Principal"
  }
]
```

### `GET /api/ventas/:id`

Devuelve la venta y su detalle.

```json
{
  "id_venta": 29,
  "fecha": "2026-11-02T21:24:19.000Z",
  "id_cliente": null,
  "total": "540000.00",
  "id_usuario": 1,
  "cliente_nombre": null,
  "vendedor_nombre": "Admin Principal",
  "detalles": [
    {
      "id_detalle": 40,
      "id_producto": 10,
      "cantidad": 3,
      "precio_unitario": "180000.00",
      "subtotal": "540000.00",
      "producto_nombre": "Micrófono de Karaoke Submarino AquaBeats"
    }
  ]
}
```

Errores: `400`, `404`.

### `POST /api/ventas`

Registra una venta y descuenta el stock de forma transaccional.

**Cuerpo:**

```json
{
  "id_cliente": 1,
  "productos": [
    { "id_producto": 2, "cantidad": 2 },
    { "id_producto": 3, "cantidad": 1 }
  ]
}
```

Reglas:

- `id_cliente` es opcional; `null` u omitido significa consumidor final. Si se envía, debe existir.
- `productos` debe tener entre 1 y 200 líneas.
- Cada `id_producto` debe existir y estar activo.
- Cada `cantidad` debe ser un entero mayor que cero.
- Las líneas repetidas del mismo producto se agrupan.
- El precio **no se acepta desde el cliente**; se toma de la base de datos.
- Si algún producto no tiene stock suficiente, se rechaza toda la venta.

**Respuesta `201`:**

```json
{
  "mensaje": "Venta registrada",
  "id_venta": 30,
  "fecha": "2026-11-02T21:30:00.000Z",
  "total": 540000,
  "items": 1
}
```

Errores:

| Código | Caso |
|---|---|
| `400` | Sin productos, línea inválida, cantidad fraccionaria o producto inactivo |
| `404` | Cliente o producto inexistente |
| `409` | Stock insuficiente |
| `401` | Sin token |

No existen endpoints para editar o anular ventas.

## 10. Dashboard

### `GET /api/dashboard/stats`

Requiere token. Devuelve métricas calculadas en tiempo real.

**Respuesta `200`:**

```json
{
  "total_productos": 6,
  "valor_inventario": 8980000,
  "alertas_stock": 2,
  "unidades_stock": 96,
  "total_clientes": 3,
  "total_usuarios": 2,
  "ventas_semana": { "cantidad": 1, "monto": 540000 },
  "ventas_mes": { "cantidad": 4, "monto": 2100000 },
  "unidades_vendidas_semana": 3,
  "productos_stock_bajo": [
    {
      "id_producto": 5,
      "nombre": "Audifonos USB",
      "cantidad_stock": 3,
      "stock_minimo": 5,
      "precio": 95000
    }
  ],
  "top_productos": [
    {
      "id_producto": 10,
      "nombre": "Micrófono de Karaoke Submarino AquaBeats",
      "unidades": 3,
      "monto": 540000
    }
  ],
  "ventas_grafica": [
    { "dia": "2026-10-27", "cantidad": 0, "monto": 0 },
    { "dia": "2026-11-02", "cantidad": 1, "monto": 540000 }
  ],
  "ventas_mensuales": [
    { "mes": "2026-06", "cantidad": 0, "monto": 0 },
    { "mes": "2026-11", "cantidad": 1, "monto": 540000 }
  ]
}
```

Notas:

- Solo se consideran productos activos para inventario y alertas.
- `ventas_grafica` contiene exactamente 7 días, incluidos los días sin ventas.
- `ventas_mensuales` contiene 6 meses, incluidos los meses sin ventas.
- `top_productos` considera los últimos 30 días.
- Los montos se devuelven como números.

## 11. Ejemplos con curl

### Login y obtención del token

Linux/macOS:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@stockplus.com","contrasena":"password123"}'
```

Windows (usa `curl.exe` para evitar el alias de PowerShell):

```bat
curl.exe -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"correo\":\"admin@stockplus.com\",\"contrasena\":\"password123\"}"
```

### Consultar productos con token

```bash
TOKEN="pega-aqui-el-token"
curl http://localhost:5000/api/productos \
  -H "Authorization: Bearer $TOKEN"
```

### Registrar una venta

```bash
curl -X POST http://localhost:5000/api/ventas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id_cliente":null,"productos":[{"id_producto":2,"cantidad":2}]}'
```

### Consultar el dashboard

```bash
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

## 12. Límites y comportamiento

- Tamaño máximo del cuerpo: 1 MB.
- Login: 20 intentos fallidos por 15 minutos y conexión.
- Registro: 10 solicitudes por hora y conexión.
- Lista de ventas: máximo 200 registros por solicitud.
- Productos y clientes/proveedores: hasta 500 registros en los listados.
- Las operaciones de escritura devuelven mensajes en español y no exponen detalles internos de PostgreSQL.
- La API no implementa versionado; la ruta base es `/api`.
