/**
 * StockPlus - Instalacion local guiada.
 * Requisitos: Node.js 18+ y PostgreSQL 14+ instalados y en ejecucion.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const {
  BACKEND,
  FRONTEND,
  ENV_FILE,
  ENV_EXAMPLE,
  titulo,
  fail,
  checkNode,
  runNpm,
  readEnvFile,
  envValue,
  mensajeConexion
} = require('./lib');

function clientePostgres() {
  return require(path.join(BACKEND, 'node_modules', 'pg')).Client;
}

async function preguntarConfiguracion() {
  const ejemplo = readEnvFile(ENV_EXAMPLE) || {};
  const config = {
    PG_HOST: process.env.PG_HOST || ejemplo.PG_HOST || 'localhost',
    PG_PORT: process.env.PG_PORT || ejemplo.PG_PORT || '5432',
    PG_USER: process.env.PG_USER || ejemplo.PG_USER || 'postgres',
    PG_PASSWORD: process.env.PG_PASSWORD || '',
    PG_DB: process.env.PG_DB || ejemplo.PG_DB || 'stockplus'
  };

  const interactivo = process.stdin.isTTY && process.env.STOCKPLUS_SIN_ENTRADA !== '1';

  if (!interactivo) {
    if (!config.PG_PASSWORD) {
      fail(
        'No existe backend/.env y no se indico la contrasena de PostgreSQL.',
        'Ejecuta el asistente en una terminal interactiva o define PG_PASSWORD antes de ejecutarlo.'
      );
    }
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const preguntar = (texto, porDefecto) => new Promise((resolve) => {
      const etiqueta = porDefecto ? `${texto} [${porDefecto}]` : texto;
      rl.question(`${etiqueta}: `, (respuesta) => resolve(respuesta.trim() || porDefecto || ''));
    });

    console.log('Ingresa los datos de tu instalacion de PostgreSQL.');
    console.log('Si instalaste PostgreSQL con las opciones por defecto, el usuario es "postgres".\n');

    config.PG_HOST = await preguntar('Host', config.PG_HOST);
    config.PG_PORT = await preguntar('Puerto', config.PG_PORT);
    config.PG_USER = await preguntar('Usuario', config.PG_USER);
    config.PG_PASSWORD = await preguntar('Contrasena (se muestra al escribir)', config.PG_PASSWORD);
    config.PG_DB = await preguntar('Nombre de la base de datos', config.PG_DB);

    rl.close();
  }

  const puerto = Number(config.PG_PORT);
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    fail('El puerto de PostgreSQL no es valido.', 'Usa un numero entre 1 y 65535, por ejemplo 5432.');
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(config.PG_DB)) {
    fail(
      'El nombre de la base de datos no es valido.',
      'Usa solo letras, numeros y guion bajo, por ejemplo: stockplus'
    );
  }

  const secreto = crypto.randomBytes(48).toString('hex');
  const contenido = [
    '# ============================================',
    '# StockPlus - Configuracion local generada por el instalador',
    '# No compartas este archivo: contiene credenciales.',
    '# ============================================',
    '',
    '# PostgreSQL (instalacion local)',
    `PG_HOST=${envValue(config.PG_HOST)}`,
    `PG_PORT=${envValue(config.PG_PORT)}`,
    `PG_USER=${envValue(config.PG_USER)}`,
    `PG_PASSWORD=${envValue(config.PG_PASSWORD)}`,
    `PG_DB=${envValue(config.PG_DB)}`,
    '',
    '# Base de datos exclusiva para pruebas automatizadas',
    'PG_DB_TEST="stockplus_test"',
    '',
    '# Seguridad JWT',
    `JWT_SECRET_KEY=${envValue(secreto)}`,
    'JWT_EXPIRES_IN="8h"',
    '',
    '# Servidor',
    'PORT="5000"',
    '# npm run dev fuerza development; npm start usa produccion.',
    'NODE_ENV="production"',
    'TRUST_PROXY=""',
    '',
    '# Registro publico de vendedores y limite general de peticiones',
    'ALLOW_REGISTRATION="true"',
    'API_RATE_LIMIT_MAX="1000"',
    '',
    '# PostgreSQL gestionado (opcional)',
    'PG_SSL="false"',
    '',
    '# Origenes permitidos para CORS (opcional, separados por coma)',
    'CORS_ORIGINS=""',
    ''
  ].join('\n');

  fs.writeFileSync(ENV_FILE, contenido, 'utf8');
  console.log('\n  Archivo backend/.env creado.');
  return config;
}

function asegurarSecretoJwt(env) {
  const debil = !env.JWT_SECRET_KEY
    || env.JWT_SECRET_KEY.length < 32
    || env.JWT_SECRET_KEY.includes('CAMBIA')
    || env.JWT_SECRET_KEY.includes('cambiar')
    || /secret|password|stockplus/i.test(env.JWT_SECRET_KEY);

  if (!debil) return;

  const secreto = crypto.randomBytes(48).toString('hex');
  let texto = fs.readFileSync(ENV_FILE, 'utf8');

  if (/^JWT_SECRET_KEY=.*$/m.test(texto)) {
    texto = texto.replace(/^JWT_SECRET_KEY=.*$/m, `JWT_SECRET_KEY=${envValue(secreto)}`);
  } else {
    texto += `\nJWT_SECRET_KEY=${envValue(secreto)}\n`;
  }

  fs.writeFileSync(ENV_FILE, texto, 'utf8');
  env.JWT_SECRET_KEY = secreto;
  console.log('  Se genero una clave JWT segura en backend/.env.');
}

function asegurarDependencias(directorio, dependencia, etiqueta) {
  const nodeModules = path.join(directorio, 'node_modules');
  const instalada = fs.existsSync(path.join(nodeModules, dependencia));

  if (instalada) {
    console.log(`  ${etiqueta}: dependencias presentes.`);
    return;
  }

  const args = !fs.existsSync(nodeModules) && fs.existsSync(path.join(directorio, 'package-lock.json'))
    ? ['ci', '--no-audit', '--no-fund']
    : ['install', '--no-audit', '--no-fund'];

  console.log(`  ${etiqueta}: instalando dependencias (puede tardar unos minutos)...`);
  runNpm(args, directorio);

  if (!fs.existsSync(path.join(nodeModules, dependencia))) {
    fail(
      `No se pudieron instalar las dependencias del ${etiqueta.toLowerCase()}.`,
      'Verifica tu conexion a internet, borra la carpeta node_modules y vuelve a intentar.'
    );
  }
}

async function prepararBaseDatos(env) {
  const Client = clientePostgres();
  const config = {
    host: env.PG_HOST || 'localhost',
    port: Number(env.PG_PORT || 5432),
    user: env.PG_USER || 'postgres',
    password: env.PG_PASSWORD || '',
    database: env.PG_DB || 'stockplus'
  };

  if (config.password === 'TU_CONTRASENA_AQUI') {
    fail(
      'backend/.env todavia contiene la contrasena de ejemplo.',
      'Abre backend/.env y escribe la contrasena real del usuario de PostgreSQL.'
    );
  }

  const admin = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres',
    connectionTimeoutMillis: 10000
  });

  try {
    await admin.connect();
  } catch (err) {
    fail('No se pudo conectar a PostgreSQL.', mensajeConexion(err, config));
  }

  try {
    const existe = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [config.database]);

    if (existe.rowCount === 0) {
      try {
        await admin.query(`CREATE DATABASE "${config.database}"`);
        console.log(`  Base de datos "${config.database}" creada.`);
      } catch (err) {
        fail(`No se pudo crear la base de datos "${config.database}".`, mensajeConexion(err, config));
      }
    } else {
      console.log(`  Base de datos "${config.database}" encontrada.`);
    }
  } finally {
    await admin.end().catch(() => {});
  }

  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
  } catch (err) {
    fail(`No se pudo abrir la base de datos "${config.database}".`, mensajeConexion(err, config));
  }

  const cargarDatosDemo = process.env.STOCKPLUS_SKIP_SEED !== '1';

  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    const seed = cargarDatosDemo
      ? fs.readFileSync(path.join(__dirname, '..', 'database', 'seed.sql'), 'utf8')
      : null;

    await client.query('BEGIN');
    await client.query(schema);
    if (seed) await client.query(seed);
    await client.query('COMMIT');

    if (seed) {
      const usuarios = await client.query('SELECT COUNT(*)::int AS total FROM usuarios');
      console.log(`  Esquema y datos de demostracion cargados (${usuarios.rows[0].total} usuarios).`);
    } else {
      console.log('  Esquema cargado sin datos de demostracion (STOCKPLUS_SKIP_SEED=1).');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    fail(
      'No se pudo preparar el esquema de la base de datos.',
      `Detalle: ${err.message}\n  Revisa que el usuario de PostgreSQL pueda crear tablas.`
    );
  } finally {
    await client.end().catch(() => {});
  }

  return cargarDatosDemo;
}

async function main() {
  titulo('StockPlus - Instalacion local');
  checkNode();

  console.log('Este asistente deja la aplicacion lista para usar en este equipo.');
  console.log('Requisitos: Node.js 18+ y PostgreSQL 14+ instalados y en ejecucion.');

  console.log('\n[1/5] Configuracion');
  let env;

  if (fs.existsSync(ENV_FILE)) {
    console.log('  Se usa el archivo backend/.env existente.');
    env = readEnvFile(ENV_FILE);
    asegurarSecretoJwt(env);
  } else {
    console.log('  No existe backend/.env; configuraremos la conexion a PostgreSQL.');
    env = await preguntarConfiguracion();
  }

  console.log('\n[2/5] Dependencias del backend');
  asegurarDependencias(BACKEND, 'pg', 'Backend');

  console.log('\n[3/5] Base de datos PostgreSQL');
  const datosDemo = await prepararBaseDatos(env);

  console.log('\n[4/5] Dependencias del frontend');
  asegurarDependencias(FRONTEND, 'vite', 'Frontend');

  console.log('\n[5/5] Compilando la aplicacion web');
  runNpm(['run', 'build'], FRONTEND);

  titulo('StockPlus quedo instalado');
  console.log('  Para iniciar la aplicacion:');
  console.log('    Windows:        INICIAR.bat');
  console.log('    Linux / macOS:  bash iniciar.sh');
  console.log('    Cualquier SO:   npm start');
  console.log('');
  console.log('  Direccion:      http://localhost:5000');

  if (datosDemo) {
    console.log('  Administrador:  admin@stockplus.com / password123');
    console.log('  Vendedor:       vendedor@stockplus.com / password123');
    console.log('');
    console.log('  IMPORTANTE: cambia la contrasena del administrador antes de');
    console.log('  usar la aplicacion con datos reales (menu lateral > Cambiar contrasena).');
  } else {
    console.log('');
    console.log('  Crea el primer administrador con:');
    console.log('    npm run db:create-admin');
  }
  console.log('');
  console.log('  Documentacion: docs/INSTALACION_LOCAL.md y docs/MANUAL_USUARIO.md');
  console.log('');
}

main().catch((err) => {
  fail('La instalacion no pudo completarse.', err && err.stack ? err.stack : String(err));
});
