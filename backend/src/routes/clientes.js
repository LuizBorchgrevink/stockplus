/**
 * StockPlus - Rutas de Clientes
 * CRUD completo para gestión de clientes
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/clientes
 * Lista todos los clientes ordenados por nombre
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM clientes ORDER BY nombre');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/clientes/:id
 * Obtiene un cliente por su ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/clientes
 * Crea un nuevo cliente
 */
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    if (!d || !(d.nombre || '').trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      'INSERT INTO clientes (nombre, correo, telefono) VALUES ($1, $2, $3) RETURNING id_cliente',
      [d.nombre.trim(), d.correo || null, d.telefono || null]
    );

    return res.status(201).json({ mensaje: 'Cliente creado', id: result.rows[0].id_cliente });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/clientes/:id
 * Actualiza un cliente existente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;
    if (!d || !(d.nombre || '').trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      'UPDATE clientes SET nombre=$1, correo=$2, telefono=$3 WHERE id_cliente=$4',
      [d.nombre.trim(), d.correo || null, d.telefono || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.json({ mensaje: 'Cliente actualizado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/clientes/:id
 * Elimina un cliente por su ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM clientes WHERE id_cliente = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.json({ mensaje: 'Cliente eliminado' });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('foreign key') || msg.includes('ventas')) {
      return res.status(409).json({
        error: 'No se puede eliminar el cliente porque tiene ventas registradas.'
      });
    }
    return res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
});

module.exports = router;
