/**
 * StockPlus - Arranque local.
 * Verifica la configuracion y la base de datos, compila la web si hace falta
 * y sirve la aplicacion completa desde un unico puerto.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const {
  BACKEND,
  FRONTEND,
  ENV_FILE,
  titulo,
  fail,
  readEnvFile,
  runNpm,
  abrirNavegador,
  mensajeConexion
} = require('./lib');

function ipDeRedLocal() {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces || []) {
      if (item.family === 'IPv4' && !item.internal) return item.address;
    }
  }
  return null;
}

async function verificarBaseDatos(env) {
  const { Client } = require(path.join(BACKEND, 'node_modules', 'pg'));
  const config = {
    host: env.PG_HOST || 'localhost',
    port: Number(env.PG_PORT || 5432),
    user: env.PG_USER || 'postgres',
    password: env.PG_PASSWORD || '',
    database: env.PG_DB || 'stockplus'
  };

  const client = new Client({ ...config, connectionTimeoutMillis: 6000 });

  try {
    await client.connect();
    await client.query('SELECT 1');
  } catch (err) {
    fail(
      'No se pudo conectar con la base de datos de StockPlus.',
      `${mensajeConexion(err, config)}\n  Si el problema continua, vuelve a ejecutar la instalacion.`
    );
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  if (!fs.existsSync(ENV_FILE)) {
    fail(
      'Falta el archivo de configuracion backend/.env.',
      'Ejecuta primero la instalacion:  npm run setup  (o SETUP.bat en Windows).'
    );
  }

  if (!fs.existsSync(path.join(BACKEND, 'node_modules', 'pg'))) {
    fail(
      'Faltan las dependencias del backend.',
      'Ejecuta la instalacion:  npm run setup  (o SETUP.bat en Windows).'
    );
  }

  const env = readEnvFile(ENV_FILE);
  const puerto = Number(process.env.PORT || env.PORT || 5000);

  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    fail(
      'El puerto configurado no es valido.',
      'Revisa PORT en backend/.env. Debe ser un numero entre 1 y 65535.'
    );
  }

  const urlApp = `http://localhost:${puerto}`;

  const dist = path.join(FRONTEND, 'dist', 'index.html');
  if (!fs.existsSync(dist)) {
    console.log('La aplicacion web no esta compilada. Compilando ahora...');
    if (!fs.existsSync(path.join(FRONTEND, 'node_modules', 'vite'))) {
      fail(
        'Faltan las dependencias del frontend.',
        'Ejecuta la instalacion:  npm run setup  (o SETUP.bat en Windows).'
      );
    }
    runNpm(['run', 'build'], FRONTEND);
  }

  await verificarBaseDatos(env);

  const redLocal = ipDeRedLocal();

  titulo('Iniciando StockPlus');
  console.log(`  Direccion:  ${urlApp}`);
  if (redLocal) {
    console.log(`  Red local:  http://${redLocal}:${puerto}`);
  }
  console.log('  Detener:    Ctrl + C');
  console.log('');

  const hijo = spawn(process.execPath, ['src/app.js'], {
    cwd: BACKEND,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(puerto),
      // El arranque normal es modo produccion; npm run dev fuerza development.
      NODE_ENV: process.env.NODE_ENV || 'production'
    }
  });

  if (process.argv.includes('--open')) {
    setTimeout(() => abrirNavegador(urlApp), 2500).unref();
  }

  let cerrando = false;
  const detener = (senal) => {
    if (cerrando) return;
    cerrando = true;
    if (hijo.exitCode === null) {
      hijo.kill(senal);
    }
    setTimeout(() => process.exit(0), 9000).unref();
  };

  process.on('SIGINT', () => detener('SIGINT'));
  process.on('SIGTERM', () => detener('SIGTERM'));

  hijo.on('error', (err) => {
    fail('No se pudo iniciar el servidor.', err.message);
  });

  hijo.on('exit', (codigo) => {
    process.exit(codigo === null ? 0 : codigo);
  });
}

main().catch((err) => {
  fail('No se pudo iniciar StockPlus.', err && err.stack ? err.stack : String(err));
});
