/**
 * StockPlus - Rutas de Productos
 * CRUD completo para productos con gestión de inventario
 * Los productos no se eliminan físicamente, se ocultan (activo = false)
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/productos
 * Lista productos activos. Usa ?todos=true para incluir ocultos.
 */
router.get('/', async (req, res) => {
  try {
    const incluirTodos = req.query.todos === 'true';
    const whereClause = incluirTodos ? '' : 'WHERE p.activo = true';
    const result = await query(`
      SELECT p.*, pr.nombre AS proveedor_nombre
      FROM productos p
      LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      ${whereClause}
      ORDER BY p.activo DESC, p.nombre
    `);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/productos/stock-bajo
 * Lista productos activos con stock igual o por debajo del mínimo
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
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/productos/:id
 * Obtiene un producto por su ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM productos WHERE id_producto = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/productos
 * Crea un nuevo producto (siempre activo)
 */
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    if (!d) {
      return res.status(400).json({ error: 'No se recibieron datos' });
    }

    const nombre = (d.nombre || '').trim();
    const descripcion = d.descripcion || '';
    const precio = parseFloat(d.precio || 0);
    const cantidad_stock = parseInt(d.cantidad_stock || 0, 10);
    const stock_minimo = parseInt(d.stock_minimo || 5, 10);
    let id_proveedor = d.id_proveedor || null;
    if (id_proveedor) {
      id_proveedor = parseInt(id_proveedor, 10);
    }

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    if (precio <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a cero' });
    }
    if (cantidad_stock < 0) {
      return res.status(400).json({ error: 'El stock no puede ser negativo' });
    }

    const result = await query(
      `INSERT INTO productos
         (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
         VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id_producto`,
      [nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor]
    );

    return res.status(201).json({ mensaje: 'Producto creado', id: result.rows[0].id_producto });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/productos/:id
 * Actualiza un producto existente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;
    if (!d) {
      return res.status(400).json({ error: 'No se recibieron datos' });
    }

    const nombre = (d.nombre || '').trim();
    const descripcion = d.descripcion || '';
    const precio = parseFloat(d.precio || 0);
    const cantidad_stock = parseInt(d.cantidad_stock || 0, 10);
    const stock_minimo = parseInt(d.stock_minimo || 5, 10);
    let id_proveedor = d.id_proveedor || null;
    if (id_proveedor) {
      id_proveedor = parseInt(id_proveedor, 10);
    }

    const result = await query(
      `UPDATE productos
         SET nombre=$1, descripcion=$2, precio=$3,
             cantidad_stock=$4, stock_minimo=$5, id_proveedor=$6
         WHERE id_producto=$7`,
      [nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ mensaje: 'Producto actualizado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/productos/:id
 * Oculta un producto del inventario (activo = false).
 * No elimina físicamente para preservar el historial de ventas.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE productos SET activo = false WHERE id_producto = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ mensaje: 'Producto ocultado del inventario' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al ocultar el producto' });
  }
});

/**
 * POST /api/productos/:id/restaurar
 * Restaura un producto ocultado (activo = true)
 */
router.post('/:id/restaurar', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE productos SET activo = true WHERE id_producto = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.json({ mensaje: 'Producto restaurado al inventario' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al restaurar el producto' });
  }
});

module.exports = router;
