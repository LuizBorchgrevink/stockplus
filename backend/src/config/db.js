/**
 * StockPlus - Configuración del Pool de Conexiones PostgreSQL
 * Usa el paquete 'pg' para gestión eficiente de conexiones
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DB || 'stockplus',
  connectionTimeoutMillis: 10000,
  // Pool de conexiones optimizado
  max: 20,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false
});

// Verificar conexión al iniciar
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
  process.exit(-1);
});

pool.on('connect', () => {
  // Conexión silenciosa al pool (no loguear cada conexión)
});

/**
 * Ejecuta una consulta SQL con parámetros y devuelve las filas.
 * Las consultas SELECT devuelven un array de objetos.
 * Las consultas INSERT/UPDATE/DELETE devuelven un objeto result.
 *
 * @param {string} text - Consulta SQL con placeholders $1, $2, ...
 * @param {Array} params - Parámetros para la consulta
 * @returns {Promise<Array|Object>} Resultado de la consulta
 */
async function query(text, params = []) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text: text.substring(0, 80), duration: `${duration}ms`, rows: res.rowCount });
  }

  return res;
}

/**
 * Obtiene un cliente del pool para transacciones manuales.
 * Recuerda hacer client.release() al terminar.
 *
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
