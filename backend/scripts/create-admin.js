/**
 * Crea (o promueve) un administrador desde la linea de comandos.
 * Uso directo:
 *   node scripts/create-admin.js --email=admin@negocio.com --password=ClaveSegura123 --nombre="Admin"
 * Uso interactivo:
 *   npm run db:create-admin
 */
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/config/db');

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : '';
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  let correo = argValue('email');
  let contrasena = argValue('password');
  let nombre = argValue('nombre');

  if (!correo) correo = await ask('Correo del administrador: ');
  if (!nombre) nombre = (await ask('Nombre (opcional): ')) || 'Administrador';
  if (!contrasena) contrasena = await ask('Contrasena (minimo 8 caracteres): ');

  correo = correo.trim().toLowerCase();
  nombre = nombre.trim() || 'Administrador';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 100) {
    throw new Error('El correo no es valido.');
  }
  if (typeof contrasena !== 'string' || contrasena.length < 8 || contrasena.length > 72) {
    throw new Error('La contrasena debe tener entre 8 y 72 caracteres.');
  }

  const hash = await bcrypt.hash(contrasena, 12);
  const existente = await query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);

  if (existente.rowCount > 0) {
    await query(
      `UPDATE usuarios
       SET nombre = $1, contrasena = $2, rol = 'administrador'
       WHERE correo = $3`,
      [nombre, hash, correo]
    );
    console.log(`Usuario existente actualizado como administrador: ${correo}`);
    return;
  }

  await query(
    `INSERT INTO usuarios (nombre, correo, contrasena, rol)
     VALUES ($1, $2, $3, 'administrador')`,
    [nombre, correo, hash]
  );
  console.log(`Administrador creado: ${correo}`);
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
