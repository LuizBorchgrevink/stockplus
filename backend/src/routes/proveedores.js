/**
 * StockPlus - Rutas de Proveedores
 * CRUD de proveedores. Las modificaciones son exclusivas del administrador.
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { HttpError, sendError } = require('../utils/http');
const { parseId, text, isPhone } = require('../utils/validation');

const router = express.Router();

router.use(authMiddleware);

function parseProviderBody(body) {
  const data = body || {};

  const nombre = text(data.nombre, 100);
  if (!nombre) {
    throw new HttpError(400, 'El nombre es requerido (maximo 100 caracteres)');
  }

  const contacto = text(data.contacto, 100);
  if (contacto === null) {
    throw new HttpError(400, 'El contacto no puede superar 100 caracteres');
  }

  const telefono = text(data.telefono, 20);
  if (telefono && !isPhone(telefono)) {
    throw new HttpError(400, 'El telefono solo puede contener numeros, espacios, +, - y parentesis');
  }

  const direccion = text(data.direccion, 255);
  if (direccion === null) {
    throw new HttpError(400, 'La direccion no puede superar 255 caracteres');
  }

  return {
    nombre,
    contacto: contacto || null,
    telefono: telefono || null,
    direccion: direccion || null
  };
}

/**
 * GET /api/proveedores?buscar=texto
 */
router.get('/', async (req, res) => {
  try {
    const buscar = text(req.query.buscar, 100) || '';
    const params = [];
    let where = '';

    if (buscar) {
      params.push(`%${buscar}%`);
      where = 'WHERE nombre ILIKE $1 OR contacto ILIKE $1 OR telefono ILIKE $1';
    }

    const result = await query(
      `SELECT * FROM proveedores ${where} ORDER BY nombre LIMIT 500`,
      params
    );
    return res.json(result.rows);
  } catch (err) {
    return sendError(res, err, 'Error al listar los proveedores');
  }
});

/**
 * GET /api/proveedores/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'ID de proveedor invalido');

    const result = await query('SELECT * FROM proveedores WHERE id_proveedor = $1', [id]);
    if (result.rows.length === 0) {
      throw new HttpError(404, 'Proveedor no encontrado');
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return sendError(res, err, 'Error al consultar el proveedor');
  }
});

/**
 * POST /api/proveedores (solo administrador)
 */
router.post('/', requireRole('administrador'), async (req, res) => {
  try {
    const proveedor = parseProviderBody(req.body);

    const result = await query(
      `INSERT INTO proveedores (nombre, contacto, telefono, direccion)
       VALUES ($1, $2, $3, $4)
       RETURNING id_proveedor`,
      [proveedor.nombre, proveedor.contacto, proveedor.telefono, proveedor.direccion]
    );

    return res.status(201).json({
      mensaje: 'Proveedor creado',
      id: result.rows[0].id_proveedor
    });
  } catch (err) {
    return sendError(res, err, 'Error al crear el proveedor');
  }
});

/**
 * PUT /api/proveedores/:id (solo administrador)
 */
router.put('/:id', requireRole('administrador'), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'ID de proveedor invalido');

    const proveedor = parseProviderBody(req.body);

    const result = await query(
      `UPDATE proveedores
       SET nombre = $1, contacto = $2, telefono = $3, direccion = $4
       WHERE id_proveedor = $5`,
      [proveedor.nombre, proveedor.contacto, proveedor.telefono, proveedor.direccion, id]
    );

    if (result.rowCount === 0) {
      throw new HttpError(404, 'Proveedor no encontrado');
    }

    return res.json({ mensaje: 'Proveedor actualizado' });
  } catch (err) {
    return sendError(res, err, 'Error al actualizar el proveedor');
  }
});

/**
 * DELETE /api/proveedores/:id (solo administrador)
 * No permite eliminar proveedores con productos asociados.
 */
router.delete('/:id', requireRole('administrador'), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'ID de proveedor invalido');

    const productos = await query(
      'SELECT COUNT(*)::int AS total FROM productos WHERE id_proveedor = $1',
      [id]
    );

    if (productos.rows[0].total > 0) {
      throw new HttpError(
        409,
        'No se puede eliminar el proveedor porque tiene productos asociados.'
      );
    }

    const result = await query('DELETE FROM proveedores WHERE id_proveedor = $1', [id]);
    if (result.rowCount === 0) {
      throw new HttpError(404, 'Proveedor no encontrado');
    }

    return res.json({ mensaje: 'Proveedor eliminado' });
  } catch (err) {
    return sendError(res, err, 'Error al eliminar el proveedor');
  }
});

module.exports = router;
