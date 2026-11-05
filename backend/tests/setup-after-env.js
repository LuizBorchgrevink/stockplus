/**
 * Cierra el pool de PostgreSQL al terminar cada archivo de pruebas.
 * Jest aisla los modulos por archivo, por lo que cada uno tiene su propio pool.
 */
const { pool } = require('../src/config/db');

afterAll(async () => {
  await pool.end().catch(() => {});
});
