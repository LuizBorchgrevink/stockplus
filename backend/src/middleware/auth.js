/**
 * StockPlus - Middleware de Autenticación JWT
 * Valida tokens Bearer en las rutas protegidas
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'stockplus-dev-secret-key-cambiar-en-produccion';

/**
 * Middleware que valida el token JWT en el header Authorization.
 * Si es válido, inyecta req.user con los datos del usuario.
 * Si no es válido, responde con 401.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const token = authHeader.substring(7); // Remover "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contiene { id, nombre, rol }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', detalle: 'Inicia sesión nuevamente' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido', detalle: err.message });
    }
    return res.status(401).json({ error: 'Error de autenticación' });
  }
}

/**
 * Genera un token JWT con la identidad del usuario.
 * El payload contiene: { id, nombre, rol }
 *
 * @param {Object} userData - { id, nombre, rol }
 * @returns {string} Token JWT
 */
function generateToken(userData) {
  return jwt.sign(userData, JWT_SECRET, {
    // Sin expiración (sesión activa) - coherente con el comportamiento anterior de Flask
  });
}

module.exports = { authMiddleware, generateToken };
