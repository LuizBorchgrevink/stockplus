/**
 * StockPlus - Rutas de Autenticación
 * Login, Registro y validación de token
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en el sistema
 */
router.post('/register', async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: 'No se recibieron datos' });
    }

    const nombre = (data.nombre || '').trim();
    const correo = (data.correo || '').trim();
    const contrasena = data.contrasena || '';

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Hash de la contraseña con bcrypt (salt rounds: 12, coherente con Flask)
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
    const errorMsg = err.message || '';
    if (errorMsg.toLowerCase().includes('correo') || errorMsg.toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

/**
 * POST /api/auth/login
 * Autentica un usuario y devuelve un token JWT
 */
router.post('/login', async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: 'No se recibieron datos' });
    }

    const correo = (data.correo || '').trim();
    const contrasena = data.contrasena || '';

    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    // Buscar usuario por correo
    const result = await query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Verificar contraseña con bcrypt
    const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar token JWT con la misma estructura que Flask: { id, nombre, rol }
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
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

/**
 * GET /api/auth/me
 * Retorna la información del usuario autenticado desde el token JWT
 */
router.get('/me', authMiddleware, (req, res) => {
  try {
    // req.user ya fue decodificado por authMiddleware
    return res.json({
      id: req.user.id,
      nombre: req.user.nombre,
      rol: req.user.rol
    });
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;
