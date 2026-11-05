# Manual de usuario de StockPlus

Este manual describe el uso diario de StockPlus: inicio de sesión, módulos, roles, registro de ventas, inventario, clientes, proveedores y tareas frecuentes.

## 1. Roles del sistema

StockPlus tiene dos roles:

| Acción | Administrador | Vendedor |
|---|---|---|
| Ver dashboard e inventario | Sí | Sí |
| Registrar ventas | Sí | Sí |
| Crear y editar clientes | Sí | Sí |
| Eliminar clientes | Sí | No |
| Crear, editar y ocultar productos | Sí | No |
| Restaurar productos ocultos | Sí | No |
| Crear, editar y eliminar proveedores | Sí | No |
| Cambiar su propia contraseña | Sí | Sí |

Las cuentas creadas desde **Regístrate** se crean con rol **Vendedor**. La creación o promoción de administradores se realiza por el equipo técnico; consulta el [manual técnico](MANUAL_TECNICO.md).

## 2. Iniciar sesión

1. Abre `http://localhost:5000` en el navegador.
2. Ingresa tu correo y contraseña.
3. Pulsa **Iniciar sesión**.

Credenciales de demostración:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@stockplus.com` | `password123` |
| Vendedor | `vendedor@stockplus.com` | `password123` |

Recomendaciones:

- Cambia la contraseña de demostración antes de usar datos reales.
- No compartas tu contraseña ni uses la misma cuenta en varios puestos de trabajo.
- Si olvidaste tu contraseña, un administrador o el equipo técnico puede restablecerla; consulta el manual de instalación.

## 3. Crear una cuenta

1. En la pantalla de inicio de sesión, pulsa **Regístrate**.
2. Completa nombre, correo y contraseña (mínimo 8 caracteres).
3. Acepta las condiciones de uso y pulsa **Crear cuenta**.
4. La cuenta se crea con rol **Vendedor**. Después podrás iniciar sesión.

Si el correo ya está registrado, el sistema mostrará un mensaje de error. Usa otro correo o inicia sesión con la cuenta existente.

## 4. Navegación general

El menú lateral contiene:

- **Dashboard**
- **Inventario**
- **Ventas**
- **Clientes**
- **Proveedores**
- **Cambiar contraseña**
- **Cerrar sesión**

En pantallas pequeñas, el menú se oculta y aparece un botón de menú (☰) en la esquina superior izquierda. Pulsa el botón para abrirlo y el ícono ✕ para cerrarlo.

En el dashboard puedes activar el **modo oscuro** con el interruptor ☀/☾ de la esquina superior derecha. La preferencia se guarda en el navegador.

## 5. Dashboard

El dashboard muestra información calculada a partir de los datos reales del sistema.

### Indicadores principales

| Indicador | Qué significa |
|---|---|
| **Productos activos** | Cantidad de productos visibles en el inventario |
| **Ventas esta semana** | Número de ventas registradas en los últimos 7 días |
| **Valor del inventario** | Suma de precio × stock de los productos activos |
| **Productos por reponer** | Productos activos cuyo stock está en el mínimo o por debajo |

### Tarjetas y gráficas

- **Clientes:** total de clientes registrados y total de usuarios del sistema.
- **Movimiento de inventario:** compara las unidades vendidas en los últimos 7 días con las unidades disponibles en stock.
- **Top productos (30 días):** productos con más unidades vendidas en los últimos 30 días.
- **Ventas de los últimos 7 días:** monto total vendido por día.

Los períodos son móviles: “últimos 7 días” y “últimos 30 días” se cuentan desde la fecha actual.

Si aparece un mensaje de error, pulsa **Reintentar**. Si persiste, verifica que el servidor y PostgreSQL estén en ejecución.

## 6. Inventario

### Consultar productos

La tabla muestra nombre, descripción, precio, stock, estado y proveedor.

Estados:

- **OK:** el stock es mayor que el stock mínimo.
- **Stock bajo:** el stock es igual o menor que el stock mínimo, pero mayor que cero.
- **Agotado:** el stock es cero.
- **Inactivo:** el producto está oculto; solo se ve al activar **Mostrar ocultos**.

Usa el campo **Buscar producto** para filtrar por nombre. El contador indica cuántos productos activos hay.

### Crear un producto (solo administrador)

1. Pulsa **+ Nuevo producto**.
2. Completa:
   - **Nombre** (obligatorio, máximo 100 caracteres).
   - **Descripción** (opcional, máximo 2000 caracteres).
   - **Precio en COP** (obligatorio, mayor que cero).
   - **Stock actual** (obligatorio, entero mayor o igual a cero).
   - **Stock mínimo** (por defecto 5). Cuando el stock llegue a este valor o menos, aparecerá como “Stock bajo”.
   - **Proveedor** (opcional).
3. Pulsa **Crear**.

### Editar un producto (solo administrador)

1. Localiza el producto y pulsa **Editar**.
2. Modifica los campos necesarios.
3. Pulsa **Actualizar**.

La edición del stock es la forma de registrar entradas de mercancía o corregir diferencias de inventario.

### Ocultar un producto (solo administrador)

1. Pulsa **Ocultar** en la fila del producto.
2. Confirma la acción.

El producto deja de aparecer en las ventas nuevas, pero **se conserva en el historial de ventas**. No se borra físicamente.

### Restaurar un producto oculto (solo administrador)

1. Pulsa **Mostrar ocultos**.
2. Localiza el producto marcado como inactivo.
3. Pulsa **Restaurar** y confirma.

### Notas para vendedores

Un vendedor puede consultar todo el inventario y ver los productos ocultos, pero no puede crear, editar, ocultar ni restaurar productos. La aplicación muestra un aviso con esta restricción.

## 7. Ventas

### Registrar una venta

1. Abre **Ventas**.
2. Pulsa **+ Registrar venta**.
3. Selecciona un cliente o deja **Consumidor final**.
4. En **Productos**, elige un producto con stock disponible.
5. Indica la cantidad.
6. Si necesitas varios productos, pulsa **+ Agregar producto** y repite.
7. Revisa el total. El precio se toma automáticamente del inventario; no se puede modificar desde la venta.
8. Pulsa **Registrar venta**.

Al confirmar:

- Se crea la venta y su detalle.
- El stock de cada producto se descuenta automáticamente.
- La venta aparece al inicio de la lista.
- Se muestra un mensaje con el número de venta y el total.

### Reglas importantes

- Solo se pueden vender productos **activos** y con **stock suficiente**.
- Si agregas dos veces el mismo producto, el sistema suma las cantidades y descuenta el stock una sola vez.
- Si la cantidad supera el stock, la venta se rechaza y no se modifica ningún dato.
- El total se calcula con el precio vigente en el inventario al momento de registrar la venta.
- Las ventas registradas **no se pueden editar ni anular** desde la interfaz. Si necesitas corregir una venta, el administrador debe ajustar el stock manualmente desde **Inventario > Editar**; el registro histórico de la venta se mantiene.

### Consultar ventas

La tabla muestra las ventas más recientes (hasta 100 en la vista), con número, fecha, cliente, vendedor y total.

Pulsa **Ver detalle** para consultar:

- Fecha, cliente, vendedor y total.
- Productos vendidos, cantidad, precio unitario y subtotal.

Usa **Actualizar** para recargar la lista después de registrar una venta desde otro equipo.

## 8. Clientes

### Consultar y buscar

La tabla muestra nombre, correo y teléfono. Usa **Buscar cliente** para filtrar por nombre, correo o teléfono.

### Crear un cliente

1. Pulsa **+ Nuevo cliente**.
2. Completa nombre (obligatorio), correo y teléfono.
3. Pulsa **Crear**.

El correo debe tener un formato válido. El teléfono solo admite números, espacios, `+`, `-` y paréntesis.

### Editar un cliente

Pulsa **Editar**, modifica los datos y guarda.

### Eliminar un cliente (solo administrador)

1. Pulsa **Eliminar** en la fila del cliente.
2. Confirma la acción.

No se puede eliminar un cliente que tenga ventas registradas, para conservar el historial. En ese caso el sistema muestra un mensaje y sugiere mantener el registro.

## 9. Proveedores

### Consultar y buscar

La tabla muestra nombre, contacto, teléfono y dirección. Usa **Buscar proveedor** para filtrar.

### Crear o editar (solo administrador)

Completa nombre (obligatorio), contacto, teléfono y dirección. El teléfono tiene las mismas restricciones que en clientes.

### Eliminar (solo administrador)

No se puede eliminar un proveedor que tenga productos asociados. Primero cambia el proveedor de esos productos o desasócialos desde **Inventario > Editar**.

### Notas para vendedores

Un vendedor puede consultar proveedores, pero no crear, editar ni eliminar. La aplicación muestra un aviso con esta restricción.

## 10. Cambiar contraseña

1. Abre el menú lateral.
2. Pulsa **Cambiar contraseña**.
3. Ingresa la contraseña actual.
4. Escribe la nueva contraseña y confírmala.
5. Pulsa **Guardar contraseña**.

Requisitos:

- Entre 8 y 72 caracteres.
- Debe ser diferente a la contraseña actual.
- La confirmación debe coincidir exactamente.

## 11. Cerrar sesión

Abre el menú lateral y pulsa **Cerrar sesión**. La sesión expira automáticamente después de 8 horas de inactividad configurada, o antes si el administrador cambia la configuración.

## 12. Mensajes frecuentes

| Mensaje | Significado | Qué hacer |
|---|---|---|
| `Credenciales incorrectas` | Correo o contraseña incorrectos | Verifica los datos e intenta de nuevo |
| `La cuenta no existe` / error al registrarse | El correo ya está registrado o los datos no son válidos | Usa otro correo o inicia sesión |
| `No tienes permisos para realizar esta accion` | Tu rol no permite esa operación | Solicita la tarea a un administrador |
| `Stock insuficiente para...` | La cantidad supera el stock actual | Reduce la cantidad o repón el producto |
| `El producto ... no esta disponible` | El producto está oculto | Un administrador debe restaurarlo |
| `No se puede eliminar el cliente porque tiene ventas registradas` | Protección del historial | Conserva el cliente |
| `No se puede eliminar el proveedor porque tiene productos asociados` | Protección de integridad | Reasigna los productos primero |
| `Token expirado` | La sesión terminó | Inicia sesión nuevamente |
| `Demasiados intentos de inicio de sesión` | Se superó el límite de intentos | Espera 15 minutos |
| `No se pudo conectar con el servidor` | El backend está detenido o la red falló | Inicia la aplicación y verifica `/api/ping` |

## 13. Preguntas frecuentes

**¿Puedo usar StockPlus desde dos computadores a la vez?**
Sí, si ambos están en la misma red local y acceden a la misma instalación mediante la IP del equipo servidor. No está diseñado para acceso desde internet.

**¿Dónde se guardan los datos?**
En la base de datos PostgreSQL del equipo donde se instaló StockPlus. No se envían a la nube.

**¿Cómo registro la llegada de mercancía?**
Un administrador debe editar el producto en **Inventario** y aumentar el stock actual. No existe un módulo separado de compras.

**¿Cómo corrijo una venta equivocada?**
No se puede editar ni anular desde la interfaz. El administrador puede ajustar el stock del producto desde **Inventario > Editar**; la venta original permanece en el historial.

**¿Cómo creo otro administrador?**
La interfaz no incluye gestión de usuarios. Las cuentas nuevas son vendedores. La promoción de un usuario a administrador requiere una operación técnica; consulta el [manual técnico](MANUAL_TECNICO.md).

**¿Por qué no aparece un producto en Ventas?**
Puede estar oculto o tener stock cero. En Ventas solo se muestran productos activos con stock disponible.

**¿Puedo cambiar el precio de un producto vendido?**
El precio queda guardado en el detalle de la venta. Cambiar el precio del producto no altera las ventas anteriores.

**¿Qué pasa si cierro el navegador?**
La aplicación sigue ejecutándose en el servidor. Puedes volver a abrirla en `http://localhost:5000`. Para detenerla, usa **Ctrl + C** en la terminal.

**¿Cómo hago un respaldo?**
Ejecuta `npm run db:backup` desde la carpeta del proyecto. Consulta la [guía de instalación](INSTALACION_LOCAL.md#8-respaldos).

## 14. Buenas prácticas

- Cambia las contraseñas de demostración.
- Usa contraseñas largas y únicas.
- Mantén un respaldo periódico de la base de datos.
- Revisa el dashboard y los productos con stock bajo al inicio del día.
- Registra las ventas en el momento para mantener el stock actualizado.
- No ocultes productos que todavía tienen ventas en curso.
- Cierra la sesión si usas un equipo compartido.
- No expongas la aplicación directamente a internet.
