/**
 * StockPlus - Configuración del Pool de Conexiones PostgreSQL
 * Usa el paquete 'pg' para gestión eficiente de conexiones
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { Pool } = require('pg');

const sslEnabled = ['1', 'true', 'require'].includes(
  String(process.env.PG_SSL || '').toLowerCase()
);

const ssl = sslEnabled
  ? { rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true' }
  : undefined;

const sharedConfig = {
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  allowExitOnIdle: false,
  max: parseInt(process.env.PG_POOL_MAX || '20', 10),
  application_name: 'stockplus',
  statement_timeout: parseInt(process.env.PG_STATEMENT_TIMEOUT_MS || '30000', 10)
};

// DATABASE_URL permite usar PostgreSQL gestionado (Render, Railway, Neon,
// Supabase). Si la URL ya incluye sslmode, node-postgres lo interpreta.
const pool = new Pool(process.env.DATABASE_URL
  ? {
      ...sharedConfig,
      connectionString: process.env.DATABASE_URL,
      ...(sslEnabled ? { ssl } : {})
    }
  : {
      ...sharedConfig,
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT, 10) || 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DB || 'stockplus',
      ...(sslEnabled ? { ssl } : {})
    });

// Un cliente inactivo puede fallar sin que la aplicación deba caerse;
// el pool descarta esa conexión y sigue atendiendo.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
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
