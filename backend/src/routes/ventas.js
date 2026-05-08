/**
 * StockPlus - Rutas de Ventas
 * Gestión de ventas con validación de stock y descuento automático
 */
const express = require('express');
const { getClient } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/ventas
 * Lista las últimas 50 ventas con información de cliente y vendedor
 */
router.get('/', async (req, res) => {
  try {
    const { query } = require('../config/db');
    const result = await query(`
      SELECT v.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
      ORDER BY v.fecha DESC LIMIT 50
    `);

    const ventas = result.rows.map(row => {
      const r = { ...row };
      if (r.fecha) {
        r.fecha = r.fecha.toISOString();
      }
      return r;
    });

    return res.json(ventas);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ventas/:id
 * Obtiene una venta por ID con sus detalles
 */
router.get('/:id', async (req, res) => {
  try {
    const { query } = require('../config/db');
    const { id } = req.params;

    // Obtener la venta
    const ventaResult = await query(`
      SELECT v.*, c.nombre AS cliente_nombre
      FROM ventas v LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      WHERE v.id_venta = $1
    `, [id]);

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const venta = { ...ventaResult.rows[0] };
    if (venta.fecha) {
      venta.fecha = venta.fecha.toISOString();
    }

    // Obtener los detalles de la venta
    const detallesResult = await query(`
      SELECT dv.*, p.nombre AS producto_nombre
      FROM detalle_venta dv JOIN productos p ON dv.id_producto = p.id_producto
      WHERE dv.id_venta = $1
    `, [id]);

    venta.detalles = detallesResult.rows;
    return res.json(venta);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/ventas
 * Registra una nueva venta y descuenta el stock automáticamente.
 * Usa una transacción para garantizar consistencia de datos.
 */
router.post('/', async (req, res) => {
  const client = await getClient();

  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: 'No se recibieron datos' });
    }

    // req.user viene del middleware authMiddleware
    const id_usuario = req.user.id;

    let id_cliente = data.id_cliente || null;
    if (id_cliente) {
      id_cliente = parseInt(id_cliente, 10);
    }

    const productos = data.productos || [];

    if (!productos || productos.length === 0) {
      return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // Validar stock disponible para cada producto
    for (const item of productos) {
      if (item.id_producto === undefined || item.cantidad === undefined) {
        throw new Error('Datos de producto inválidos');
      }

      const prodId = parseInt(item.id_producto, 10);
      const cantidad = parseInt(item.cantidad, 10);

      if (isNaN(prodId) || isNaN(cantidad)) {
        throw new Error('Datos de producto inválidos');
      }

      if (cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a cero');
      }

      const prodResult = await client.query(
        'SELECT nombre, cantidad_stock FROM productos WHERE id_producto = $1',
        [prodId]
      );
      const prod = prodResult.rows[0];

      if (!prod) {
        throw new Error(`Producto ID ${prodId} no existe`);
      }
      if (prod.cantidad_stock < cantidad) {
        throw new Error(
          `Stock insuficiente para '${prod.nombre}'. Disponible: ${prod.cantidad_stock}`
        );
      }
    }

    // Calcular total
    let total = 0;
    for (const item of productos) {
      total += parseFloat(item.cantidad) * parseFloat(item.precio_unitario);
    }

    // Insertar venta
    const ventaResult = await client.query(
      'INSERT INTO ventas (id_cliente, total, id_usuario) VALUES ($1, $2, $3) RETURNING id_venta',
      [id_cliente, total, id_usuario]
    );
    const id_venta = ventaResult.rows[0].id_venta;

    // Insertar detalles y actualizar stock
    for (const item of productos) {
      const prodId = parseInt(item.id_producto, 10);
      const cantidad = parseInt(item.cantidad, 10);
      const precio = parseFloat(item.precio_unitario);

      await client.query(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [id_venta, prodId, cantidad, precio]
      );

      await client.query(
        'UPDATE productos SET cantidad_stock = cantidad_stock - $1 WHERE id_producto = $2',
        [cantidad, prodId]
      );
    }

    // Confirmar transacción
    await client.query('COMMIT');

    return res.status(201).json({
      mensaje: 'Venta registrada',
      id_venta,
      total
    });
  } catch (err) {
    // Revertir transacción en caso de error
    await client.query('ROLLBACK').catch(() => {});
    return res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
