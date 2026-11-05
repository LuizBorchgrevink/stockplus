/**
 * StockPlus - Rutas de Autenticacion
 * Login, registro, identidad y cambio de contrasena
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { HttpError, sendError } = require('../utils/http');
const { text, normalizeEmail, isEmail } = require('../utils/validation');

const router = express.Router();

const REGISTRO_HABILITADO = process.env.ALLOW_REGISTRATION !== 'false';

function validPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 72;
}

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con rol vendedor.
 */
router.post('/register', async (req, res) => {
  try {
    if (!REGISTRO_HABILITADO) {
      return res.status(403).json({
        error: 'El registro publico esta deshabilitado. Un administrador debe crear la cuenta.'
      });
    }

    const data = req.body || {};
    const nombre = text(data.nombre, 100);
    const correo = normalizeEmail(data.correo);
    const contrasena = data.contrasena;

    if (nombre === null || !nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    if (!isEmail(correo)) {
      return res.status(400).json({ error: 'El correo no es valido' });
    }
    if (!validPassword(contrasena)) {
      return res.status(400).json({ error: 'La contrasena debe tener entre 8 y 72 caracteres' });
    }

    const hashed = await bcrypt.hash(contrasena, 12);
    const result = await query(
      'INSERT INTO usuarios (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING id_usuario',
      [nombre, correo, hashed]
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      id: result.rows[0].id_usuario
    });
  } catch (err) {
    return sendError(res, err, 'Error al registrar usuario');
  }
});

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un token JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const data = req.body || {};
    const correo = normalizeEmail(data.correo);
    const contrasena = data.contrasena;

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contrasena son requeridos' });
    }

    const result = await query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generateToken({
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      rol: usuario.rol
    });

    return res.json({
      token,
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (err) {
    return sendError(res, err, 'Error al iniciar sesion');
  }
});

/**
 * GET /api/auth/me
 * Devuelve la identidad actual consultando la base de datos.
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id_usuario, nombre, correo, rol FROM usuarios WHERE id_usuario = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];
    return res.json({
      id: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    });
  } catch (err) {
    return sendError(res, err, 'Error al consultar el usuario');
  }
});

/**
 * PUT /api/auth/password
 * Permite a un usuario autenticado cambiar su propia contrasena.
 */
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { actual, nueva } = req.body || {};

    if (!actual || !nueva) {
      return res.status(400).json({ error: 'Debes indicar la contrasena actual y la nueva' });
    }
    if (!validPassword(nueva)) {
      return res.status(400).json({ error: 'La nueva contrasena debe tener entre 8 y 72 caracteres' });
    }
    if (actual === nueva) {
      return res.status(400).json({ error: 'La nueva contrasena debe ser diferente a la actual' });
    }

    const result = await query(
      'SELECT contrasena FROM usuarios WHERE id_usuario = $1',
      [req.user.id]
    );

    if (result.rowCount === 0) {
      throw new HttpError(401, 'Usuario no encontrado');
    }

    const match = await bcrypt.compare(actual, result.rows[0].contrasena);
    if (!match) {
      return res.status(400).json({ error: 'La contrasena actual no es correcta' });
    }

    const hash = await bcrypt.hash(nueva, 12);
    await query('UPDATE usuarios SET contrasena = $1 WHERE id_usuario = $2', [hash, req.user.id]);

    return res.json({ mensaje: 'Contrasena actualizada correctamente' });
  } catch (err) {
    return sendError(res, err, 'Error al cambiar la contrasena');
  }
});

module.exports = router;
