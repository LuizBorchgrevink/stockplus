/**
 * Error controlado con codigo HTTP y respuesta segura para el cliente.
 */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

/**
 * Responde un error sin filtrar detalles internos de PostgreSQL.
 */
function sendError(res, err, fallback = 'Error interno del servidor') {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err && err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  }
  if (err && err.code === '23503') {
    return res.status(409).json({ error: 'No se puede completar la operacion porque existen registros relacionados' });
  }
  if (err && (err.code === '23514' || err.code === '23502' || err.code === '22P02' || err.code === '22003')) {
    return res.status(400).json({ error: 'Los datos enviados no son validos' });
  }

  console.error('Error interno:', err);
  return res.status(500).json({ error: fallback });
}

module.exports = { HttpError, sendError };
