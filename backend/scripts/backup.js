/**
 * Genera un respaldo SQL de la base de datos usando pg_dump.
 * Uso: npm run backup
 * Requiere que pg_dump este disponible en el PATH (viene con PostgreSQL).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = process.env.PG_DB || 'stockplus';
const host = process.env.PG_HOST || 'localhost';
const port = process.env.PG_PORT || '5432';
const user = process.env.PG_USER || 'postgres';
const pgDump = process.env.PG_DUMP || 'pg_dump';
const retencionDias = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .slice(0, 19);

const backupsDir = path.join(__dirname, '..', '..', 'backups');
const output = path.join(backupsDir, `stockplus-${stamp}.sql`);

fs.mkdirSync(backupsDir, { recursive: true });

const envPg = { ...process.env, PGPASSWORD: process.env.PG_PASSWORD || '' };
if (['1', 'true', 'require'].includes(String(process.env.PG_SSL || '').toLowerCase())) {
  envPg.PGSSLMODE = 'require';
}

const result = spawnSync(
  pgDump,
  ['--host', host, '--port', String(port), '--username', user, '--dbname', db, '--file', output, '--no-owner', '--no-acl'],
  {
    env: envPg,
    encoding: 'utf8'
  }
);

if (result.error) {
  if (result.error.code === 'ENOENT') {
    console.error('No se encontro pg_dump.');
    console.error('Agrega la carpeta bin de PostgreSQL al PATH o define PG_DUMP con la ruta completa.');
    process.exit(1);
  }
  console.error('Error ejecutando pg_dump:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error('pg_dump fallo:', (result.stderr || '').trim());
  process.exit(result.status || 1);
}

console.log('Respaldo creado:', output);

if (Number.isInteger(retencionDias) && retencionDias > 0) {
  const limite = Date.now() - retencionDias * 24 * 60 * 60 * 1000;
  let eliminados = 0;

  for (const archivo of fs.readdirSync(backupsDir)) {
    if (!/^stockplus-.*\.sql$/.test(archivo)) continue;
    const ruta = path.join(backupsDir, archivo);
    try {
      if (fs.statSync(ruta).mtimeMs < limite) {
        fs.unlinkSync(ruta);
        eliminados += 1;
      }
    } catch {
      // Si un respaldo no se puede borrar, se conserva.
    }
  }

  if (eliminados > 0) {
    console.log(`Respaldos con mas de ${retencionDias} dias eliminados: ${eliminados}`);
  }
}
