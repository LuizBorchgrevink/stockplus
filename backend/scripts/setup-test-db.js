/**
 * Crea (si no existe) la base de datos de pruebas y aplica esquema + semilla.
 * Uso: node scripts/setup-test-db.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.PG_DB_TEST || 'stockplus_test';
const sourceDb = process.env.PG_DB || 'stockplus';

if (DB_NAME === sourceDb) {
  console.error('La base de pruebas no puede ser la misma base de desarrollo. Define PG_DB_TEST.');
  process.exit(1);
}

if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(DB_NAME)) {
  console.error('Nombre de base de pruebas invalido:', DB_NAME);
  process.exit(1);
}

const baseConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT, 10) || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || ''
};

async function main() {
  const admin = new Client({ ...baseConfig, database: 'postgres' });
  await admin.connect();

  try {
    const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Base de pruebas creada: ${DB_NAME}`);
    }
  } finally {
    await admin.end();
  }

  const schema = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'seed.sql'), 'utf8');

  const db = new Client({ ...baseConfig, database: DB_NAME });
  await db.connect();
  try {
    await db.query(schema);
    await db.query(seed);
    console.log(`Esquema y datos aplicados en: ${DB_NAME}`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('No se pudo preparar la base de pruebas:', err.message);
  console.error('Verifica PostgreSQL y las variables PG_* de backend/.env.');
  process.exit(1);
});
