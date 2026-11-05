/**
 * Cambia la contrasena de un usuario desde la linea de comandos.
 * Uso interactivo:  npm run reset-password
 * Uso directo:      node scripts/reset-password.js --email=admin@stockplus.com --password=NuevaClave123
 */
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : '';
}

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let password = '';

    stdout.write(question);

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding('utf8');

    const cleanup = () => {
      stdin.removeListener('data', onData);
      if (stdin.isTTY) stdin.setRawMode(false);
      stdin.pause();
    };

    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          cleanup();
          stdout.write('\n');
          resolve(password);
          return;
        }
        if (char === '\u0003') {
          cleanup();
          stdout.write('\n');
          process.exit(1);
        }
        if (char === '\u007f' || char === '\b') {
          password = password.slice(0, -1);
          continue;
        }
        password += char;
      }
    };

    stdin.on('data', onData);
  });
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function main() {
  let correo = argValue('email');
  let contrasena = argValue('password');

  if (!correo) correo = await ask('Correo del usuario: ');
  if (!contrasena) contrasena = await askHidden('Nueva contrasena (minimo 8 caracteres): ');

  correo = correo.trim().toLowerCase();

  if (!correo) {
    throw new Error('Debes indicar el correo del usuario.');
  }
  if (!contrasena || contrasena.length < 8) {
    throw new Error('La contrasena debe tener al menos 8 caracteres.');
  }

  const client = new Client({
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DB || 'stockplus'
  });

  await client.connect();
  try {
    const hash = await bcrypt.hash(contrasena, 12);
    const result = await client.query(
      'UPDATE usuarios SET contrasena = $1 WHERE correo = $2',
      [hash, correo]
    );

    if (result.rowCount === 0) {
      throw new Error(`No existe un usuario con el correo ${correo}.`);
    }

    console.log(`Contrasena actualizada correctamente para ${correo}.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
