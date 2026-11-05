/**
 * Middleware de autorizacion por rol.
 * Debe usarse despues de authMiddleware.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta accion' });
    }
    return next();
  };
}

module.exports = { requireRole };
