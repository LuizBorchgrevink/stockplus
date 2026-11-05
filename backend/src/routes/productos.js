/**
 * StockPlus - Rutas de Productos
 * CRUD de productos con borrado logico y control de inventario.
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { sendError } = require('../utils/http');
const {
  parseId,
  parseMoney,
  parseNonNegativeInt,
  text
} = require('../utils/validation');

const router = express.Router();

router.use(authMiddleware);

function parseProductBody(body) {
  const nombre = text(body.nombre, 100);
  const descripcion = text(body.descripcion || '', 2000);
  const precio = parseMoney(body.precio);
  const cantidad_stock = parseNonNegativeInt(body.cantidad_stock ?? 0);
  const stock_minimo = parseNonNegativeInt(body.stock_minimo ?? 5);

  let id_proveedor = null;
  if (body.id_proveedor !== undefined && body.id_proveedor !== null && body.id_proveedor !== '') {
    id_proveedor = parseId(body.id_proveedor);
    if (!id_proveedor) {
      return { error: 'El proveedor seleccionado no es valido' };
    }
  }

  if (nombre === null) return { error: 'El nombre no puede superar 100 caracteres' };
  if (!nombre) return { error: 'El nombre es requerido' };
  if (descripcion === null) return { error: 'La descripcion no puede superar 2000 caracteres' };
  if (precio === null) return { error: 'El precio debe ser mayor a cero' };
  if (cantidad_stock === null) return { error: 'El stock debe ser un entero mayor o igual a cero' };
  if (stock_minimo === null) return { error: 'El stock minimo debe ser un entero mayor o igual a cero' };

  return {
    nombre,
    descripcion,
    precio,
    cantidad_stock,
    stock_minimo,
    id_proveedor
  };
}

async function proveedorExiste(idProveedor) {
  if (!idProveedor) return true;
  const result = await query('SELECT 1 FROM proveedores WHERE id_proveedor = $1', [idProveedor]);
  return result.rowCount > 0;
}

/**
 * GET /api/productos
 * Lista productos activos. ?todos=true incluye ocultos. ?buscar= filtra por nombre.
 */
router.get('/', async (req, res) => {
  try {
    const incluirTodos = req.query.todos === 'true';
    const buscar = typeof req.query.buscar === 'string' ? req.query.buscar.trim() : '';
    const condiciones = [];
    const params = [];

    if (!incluirTodos) condiciones.push('p.activo = true');
    if (buscar) {
      params.push(`%${buscar}%`);
      condiciones.push(`p.nombre ILIKE $${params.length}`);
    }

    const whereClause = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const result = await query(`
      SELECT p.*, pr.nombre AS proveedor_nombre
      FROM productos p
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      ${whereClause}
      ORDER BY p.activo DESC, p.nombre
    `, params);

    return res.json(result.rows);
  } catch (err) {
    return sendError(res, err, 'Error al listar productos');
  }
});

/**
 * GET /api/productos/stock-bajo
 */
router.get('/stock-bajo', async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM productos
      WHERE cantidad_stock <= stock_minimo AND activo = true
      ORDER BY cantidad_stock ASC
    `);
    return res.json(result.rows);
  } catch (err) {
    return sendError(res, err, 'Error al consultar stock bajo');
  }
});

/**
 * GET /api/productos/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de producto invalido' });

    const result = await query('SELECT * FROM productos WHERE id_producto = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return sendError(res, err, 'Error al consultar el producto');
  }
});

/**
 * POST /api/productos (solo administrador)
 */
router.post('/', requireRole('administrador'), async (req, res) => {
  try {
    const data = parseProductBody(req.body || {});
    if (data.error) return res.status(400).json({ error: data.error });

    if (!(await proveedorExiste(data.id_proveedor))) {
      return res.status(400).json({ error: 'El proveedor seleccionado no existe' });
    }

    const result = await query(
      `INSERT INTO productos
         (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id_producto`,
      [data.nombre, data.descripcion, data.precio, data.cantidad_stock, data.stock_minimo, data.id_proveedor]
    );

    return res.status(201).json({ mensaje: 'Producto creado', id: result.rows[0].id_producto });
  } catch (err) {
    return sendError(res, err, 'Error al crear el producto');
  }
});

/**
 * PUT /api/productos/:id (solo administrador)
 */
router.put('/:id', requireRole('administrador'), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de producto invalido' });

    const data = parseProductBody(req.body || {});
    if (data.error) return res.status(400).json({ error: data.error });

    if (!(await proveedorExiste(data.id_proveedor))) {
      return res.status(400).json({ error: 'El proveedor seleccionado no existe' });
    }

    const result = await query(
      `UPDATE productos
         SET nombre = $1, descripcion = $2, precio = $3,
             cantidad_stock = $4, stock_minimo = $5, id_proveedor = $6
         WHERE id_producto = $7`,
      [data.nombre, data.descripcion, data.precio, data.cantidad_stock, data.stock_minimo, data.id_proveedor, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ mensaje: 'Producto actualizado' });
  } catch (err) {
    return sendError(res, err, 'Error al actualizar el producto');
  }
});

/**
 * DELETE /api/productos/:id (solo administrador)
 * Oculta el producto para conservar el historial de ventas.
 */
router.delete('/:id', requireRole('administrador'), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de producto invalido' });

    const result = await query(
      'UPDATE productos SET activo = false WHERE id_producto = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ mensaje: 'Producto ocultado del inventario' });
  } catch (err) {
    return sendError(res, err, 'Error al ocultar el producto');
  }
});

/**
 * POST /api/productos/:id/restaurar (solo administrador)
 */
router.post('/:id/restaurar', requireRole('administrador'), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de producto invalido' });

    const result = await query(
      'UPDATE productos SET activo = true WHERE id_producto = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ mensaje: 'Producto restaurado al inventario' });
  } catch (err) {
    return sendError(res, err, 'Error al restaurar el producto');
  }
});

module.exports = router;
