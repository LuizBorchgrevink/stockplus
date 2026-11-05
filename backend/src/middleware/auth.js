/**
 * StockPlus - Middleware de Autenticacion JWT
 * Valida tokens Bearer en las rutas protegidas
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET_KEY;

function validarSecreto(secret) {
  if (!secret) {
    throw new Error('JWT_SECRET_KEY es obligatorio en produccion. Configura backend/.env.');
  }
  if (secret.length < 32 || /cambiar|change|secret|password|stockplus|123456/i.test(secret)) {
    throw new Error(
      'JWT_SECRET_KEY es debil. Genera una clave aleatoria de al menos 32 caracteres: ' +
      'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
}

if (process.env.NODE_ENV === 'production') {
  validarSecreto(JWT_SECRET);
}

const SIGNING_SECRET = JWT_SECRET || 'stockplus-dev-secret-key-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Middleware que valida el token JWT en el header Authorization.
 * Si es valido, inyecta req.user con los datos del usuario.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, SIGNING_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', detalle: 'Inicia sesion nuevamente' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalido' });
    }
    return res.status(401).json({ error: 'Error de autenticacion' });
  }
}

/**
 * Genera un token JWT con expiracion.
 * El payload contiene: { id, nombre, rol }
 */
function generateToken(userData) {
  return jwt.sign(userData, SIGNING_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

module.exports = { authMiddleware, generateToken };
