/**
 * StockPlus - Rutas de Proveedores
 * CRUD completo para gestión de proveedores
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/proveedores
 * Lista todos los proveedores ordenados por nombre
 */
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM proveedores ORDER BY nombre');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/proveedores/:id
 * Obtiene un proveedor por su ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM proveedores WHERE id_proveedor = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/proveedores
 * Crea un nuevo proveedor
 */
router.post('/', async (req, res) => {
  try {
    const d = req.body;
    if (!d || !(d.nombre || '').trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      'INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES ($1, $2, $3, $4) RETURNING id_proveedor',
      [d.nombre.trim(), d.contacto || null, d.telefono || null, d.direccion || null]
    );

    return res.status(201).json({ mensaje: 'Proveedor creado', id: result.rows[0].id_proveedor });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/proveedores/:id
 * Actualiza un proveedor existente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const d = req.body;
    if (!d || !(d.nombre || '').trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const result = await query(
      'UPDATE proveedores SET nombre=$1, contacto=$2, telefono=$3, direccion=$4 WHERE id_proveedor=$5',
      [d.nombre.trim(), d.contacto || null, d.telefono || null, d.direccion || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    return res.json({ mensaje: 'Proveedor actualizado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/proveedores/:id
 * Elimina un proveedor por su ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM proveedores WHERE id_proveedor = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    return res.json({ mensaje: 'Proveedor eliminado' });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('foreign key') || msg.includes('productos')) {
      return res.status(409).json({
        error: 'No se puede eliminar el proveedor porque tiene productos asociados.'
      });
    }
    return res.status(500).json({ error: 'Error al eliminar el proveedor' });
  }
});

module.exports = router;
