/**
 * StockPlus - Rutas de Clientes
 * CRUD de clientes con validacion de datos y proteccion de historial de ventas.
 */
const express = require('express');
const { query } = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { HttpError, sendError } = require('../utils/http');
const { parseId, text, normalizeEmail, isEmail, isPhone } = require('../utils/validation');

const router = express.Router();

router.use(authMiddleware);

function parseClientBody(body) {
  const data = body || {};

  const nombre = text(data.nombre, 100);
  if (!nombre) {
    throw new HttpError(400, 'El nombre es requerido (maximo 100 caracteres)');
  }

  const correo = normalizeEmail(data.correo);
  if (correo && !isEmail(correo)) {
    throw new HttpError(400, 'El correo no es valido');
  }

  const telefono = text(data.telefono, 20);
  if (telefono && !isPhone(telefono)) {
    throw new HttpError(400, 'El telefono solo puede contener numeros, espacios, +, - y parentesis');
  }

  return {
    nombre,
    correo: correo || null,
    telefono: telefono || null
  };
}

/**
 * GET /api/clientes?buscar=texto
 */
router.get('/', async (req, res) => {
  try {
    const buscar = text(req.query.buscar, 100) || '';
    const params = [];
    let where = '';

    if (buscar) {
      params.push(`%${buscar}%`);
      where = 'WHERE nombre ILIKE $1 OR correo ILIKE $1 OR telefono ILIKE $1';
    }

    const result = await query(
      `SELECT * FROM clientes ${where} ORDER BY nombre LIMIT 500`,
      params
    );
    return res.json(result.rows);
  } catch (err) {
    return sendError(res, err, 'Error al listar los clientes');
  }
});

/**
 * GET /api/clientes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'ID de cliente invalido');

    const result = await query('SELECT * FROM clientes WHERE id_cliente = $1', [id]);
    if (result.rows.length === 0) {
      throw new HttpError(404, 'Cliente no encontrado');
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return sendError(res, err, 'Error al consultar el cliente');
  }
});

/**
 * POST /api/clientes
 */
router.post('/', async (req, res) => {
  try {
    const cliente = parseClientBody(req.body);

    const result = await query(
      `INSERT INTO clientes (nombre, correo, telefono)
       VALUES ($1, $2, $3)
       RETURNING id_cliente`,
      [cliente.nombre, cliente.correo, cliente.telefono]
    );

    return res.status(201).json({
      mensaje: 'Cliente creado',
      id: result.rows[0].id_cliente
    });
  } catch (err) {
    return sendError(res, err, 'Error al crear el cliente');
  }
});

/**
 * PUT /api/clientes/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'ID de cliente invalido');

    const cliente = parseClientBody(req.body);

    const result = await query(
      `UPDATE clientes
       SET nombre = $1, correo = $2, telefono = $3
       WHERE id_cliente = $4`,
      [cliente.nombre, cliente.correo, cliente.telefono, id]
    );

    if (result.rowCount === 0) {
      throw new HttpError(404, 'Cliente no encontrado');
    }

    return res.json({ mensaje: 'Cliente actualizado' });
  } catch (err) {
    return sendError(res, err, 'Error al actualizar el cliente');
  }
});

/**
 * DELETE /api/clientes/:id (solo administrador)
 * No permite eliminar clientes con ventas registradas.
 */
router.delete('/:id', requireRole('administrador'), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'ID de cliente invalido');

    const ventas = await query(
      'SELECT COUNT(*)::int AS total FROM ventas WHERE id_cliente = $1',
      [id]
    );

    if (ventas.rows[0].total > 0) {
      throw new HttpError(
        409,
        'No se puede eliminar el cliente porque tiene ventas registradas. Conserva el historial.'
      );
    }

    const result = await query('DELETE FROM clientes WHERE id_cliente = $1', [id]);
    if (result.rowCount === 0) {
      throw new HttpError(404, 'Cliente no encontrado');
    }

    return res.json({ mensaje: 'Cliente eliminado' });
  } catch (err) {
    return sendError(res, err, 'Error al eliminar el cliente');
  }
});

module.exports = router;
