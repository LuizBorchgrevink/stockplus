/**
 * StockPlus - Rutas de Ventas
 * Registro de ventas transaccional: valida stock, usa precios de la base
 * de datos y bloquea los productos para evitar ventas simultaneas inconsistentes.
 */
const express = require('express');
const { query, getClient } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { HttpError, sendError } = require('../utils/http');
const { parseId, parsePositiveInt } = require('../utils/validation');

const router = express.Router();

router.use(authMiddleware);

function fechaISO(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function parseLineas(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'La venta debe tener al menos un producto');
  }
  if (items.length > 200) {
    throw new HttpError(400, 'La venta no puede tener mas de 200 lineas');
  }

  // Agrupa lineas repetidas del mismo producto para descontar el stock real.
  const agrupadas = new Map();

  for (const item of items) {
    const idProducto = parseId(item && item.id_producto);
    const cantidad = parsePositiveInt(item && item.cantidad);

    if (!idProducto) {
      throw new HttpError(400, 'Cada linea debe incluir un id_producto valido');
    }
    if (!cantidad) {
      throw new HttpError(400, 'La cantidad de cada producto debe ser un entero mayor a cero');
    }

    agrupadas.set(idProducto, (agrupadas.get(idProducto) || 0) + cantidad);
  }

  return [...agrupadas.entries()]
    .map(([idProducto, cantidad]) => ({ idProducto, cantidad }))
    .sort((a, b) => a.idProducto - b.idProducto);
}

/**
 * GET /api/ventas?limite=50
 * Lista las ventas mas recientes con cliente y vendedor.
 */
router.get('/', async (req, res) => {
  try {
    let limite = parsePositiveInt(req.query.limite) || 50;
    limite = Math.min(limite, 200);

    const result = await query(
      `SELECT v.id_venta, v.fecha, v.id_cliente, v.total, v.id_usuario,
              c.nombre AS cliente_nombre,
              u.nombre AS vendedor_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
       LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
       ORDER BY v.fecha DESC, v.id_venta DESC
       LIMIT $1`,
      [limite]
    );

    return res.json(result.rows.map(row => ({ ...row, fecha: fechaISO(row.fecha) })));
  } catch (err) {
    return sendError(res, err, 'Error al listar las ventas');
  }
});

/**
 * GET /api/ventas/:id
 * Detalle completo de una venta.
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'ID de venta invalido');

    const ventaResult = await query(
      `SELECT v.id_venta, v.fecha, v.id_cliente, v.total, v.id_usuario,
              c.nombre AS cliente_nombre,
              u.nombre AS vendedor_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
       LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
       WHERE v.id_venta = $1`,
      [id]
    );

    if (ventaResult.rows.length === 0) {
      throw new HttpError(404, 'Venta no encontrada');
    }

    const venta = ventaResult.rows[0];

    const detallesResult = await query(
      `SELECT dv.id_detalle, dv.id_producto, dv.cantidad,
              dv.precio_unitario, dv.subtotal,
              p.nombre AS producto_nombre
       FROM detalle_venta dv
       JOIN productos p ON dv.id_producto = p.id_producto
       WHERE dv.id_venta = $1
       ORDER BY dv.id_detalle`,
      [id]
    );

    return res.json({
      ...venta,
      fecha: fechaISO(venta.fecha),
      detalles: detallesResult.rows
    });
  } catch (err) {
    return sendError(res, err, 'Error al consultar la venta');
  }
});

/**
 * POST /api/ventas
 * El precio unitario SIEMPRE se toma de la base de datos, nunca del cliente.
 */
router.post('/', async (req, res) => {
  const client = await getClient();

  try {
    const data = req.body || {};
    const lineas = parseLineas(data.productos);

    let idCliente = null;
    if (data.id_cliente !== undefined && data.id_cliente !== null && data.id_cliente !== '') {
      idCliente = parseId(data.id_cliente);
      if (!idCliente) {
        throw new HttpError(400, 'El cliente seleccionado no es valido');
      }
    }

    await client.query('BEGIN');

    if (idCliente) {
      const cliente = await client.query(
        'SELECT id_cliente FROM clientes WHERE id_cliente = $1',
        [idCliente]
      );
      if (cliente.rows.length === 0) {
        throw new HttpError(404, 'El cliente seleccionado no existe');
      }
    }

    let total = 0;
    const detalles = [];

    // Bloqueo en orden de ID para evitar interbloqueos entre ventas simultaneas.
    for (const linea of lineas) {
      const prodResult = await client.query(
        `SELECT id_producto, nombre, precio, cantidad_stock, activo
         FROM productos
         WHERE id_producto = $1
         FOR UPDATE`,
        [linea.idProducto]
      );

      const producto = prodResult.rows[0];
      if (!producto) {
        throw new HttpError(404, `El producto ID ${linea.idProducto} no existe`);
      }
      if (!producto.activo) {
        throw new HttpError(400, `El producto '${producto.nombre}' no esta disponible`);
      }
      if (producto.cantidad_stock < linea.cantidad) {
        throw new HttpError(
          409,
          `Stock insuficiente para '${producto.nombre}'. Disponible: ${producto.cantidad_stock}`
        );
      }

      const precio = Number(producto.precio);
      total += precio * linea.cantidad;
      detalles.push({
        idProducto: linea.idProducto,
        cantidad: linea.cantidad,
        precio
      });
    }

    total = Math.round(total * 100) / 100;

    const ventaResult = await client.query(
      `INSERT INTO ventas (id_cliente, total, id_usuario)
       VALUES ($1, $2, $3)
       RETURNING id_venta, fecha`,
      [idCliente, total, req.user.id]
    );

    const venta = ventaResult.rows[0];

    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [venta.id_venta, detalle.idProducto, detalle.cantidad, detalle.precio]
      );

      await client.query(
        `UPDATE productos
         SET cantidad_stock = cantidad_stock - $1
         WHERE id_producto = $2`,
        [detalle.cantidad, detalle.idProducto]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      mensaje: 'Venta registrada',
      id_venta: venta.id_venta,
      fecha: fechaISO(venta.fecha),
      total,
      items: detalles.length
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return sendError(res, err, 'Error al registrar la venta');
  } finally {
    client.release();
  }
});

module.exports = router;
