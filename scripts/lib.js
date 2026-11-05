/**
 * Utilidades compartidas por los scripts de instalacion y arranque local.
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const BACKUPS = path.join(ROOT, 'backups');
const ENV_FILE = path.join(BACKEND, '.env');
const ENV_EXAMPLE = path.join(BACKEND, '.env.example');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function linea() {
  console.log('============================================');
}

function titulo(texto) {
  console.log('');
  linea();
  console.log(` ${texto}`);
  linea();
}

function fail(mensaje, ayuda) {
  console.error(`\nERROR: ${mensaje}`);
  if (ayuda) console.error(ayuda);
  process.exit(1);
}

function checkNode() {
  const mayor = Number(process.versions.node.split('.')[0]);
  if (mayor < 18) {
    fail(
      `Necesitas Node.js 18 o superior. Version actual: ${process.versions.node}.`,
      'Descarga la version LTS en https://nodejs.org/ y vuelve a intentar.'
    );
  }
}

function runNpm(args, cwd) {
  const resultado = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', [NPM, ...args].join(' ')], {
        cwd,
        stdio: 'inherit',
        env: process.env
      })
    : spawnSync(NPM, args, {
        cwd,
        stdio: 'inherit',
        env: process.env
      });

  if (resultado.error) {
    fail(
      `No se pudo ejecutar npm: ${resultado.error.message}`,
      'Verifica que Node.js este instalado y que npm este disponible en el PATH.'
    );
  }
  if (resultado.status !== 0) {
    fail(`El comando "npm ${args.join(' ')}" fallo con codigo ${resultado.status}.`);
  }
}

/**
 * Lector sencillo de archivos .env (admite valores entre comillas).
 */
function parseEnv(texto) {
  const valores = {};
  for (const lineaCruda of String(texto).split(/\r?\n/)) {
    const limpia = lineaCruda.trim();
    if (!limpia || limpia.startsWith('#')) continue;

    const igual = limpia.indexOf('=');
    if (igual < 1) continue;

    const clave = limpia.slice(0, igual).trim();
    let valor = limpia.slice(igual + 1).trim();

    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      const conComillasDobles = valor.startsWith('"');
      valor = valor.slice(1, -1);
      if (conComillasDobles) {
        valor = valor.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
    } else {
      const comentario = valor.indexOf(' #');
      if (comentario >= 0) valor = valor.slice(0, comentario).trim();
    }

    valores[clave] = valor;
  }
  return valores;
}

function readEnvFile(archivo = ENV_FILE) {
  if (!fs.existsSync(archivo)) return null;
  return parseEnv(fs.readFileSync(archivo, 'utf8'));
}

function envValue(valor) {
  return `"${String(valor).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function abrirNavegador(url) {
  try {
    let comando;
    let args;

    if (process.platform === 'win32') {
      comando = 'cmd';
      args = ['/c', 'start', '', url];
    } else if (process.platform === 'darwin') {
      comando = 'open';
      args = [url];
    } else {
      comando = 'xdg-open';
      args = [url];
    }

    const hijo = spawn(comando, args, { stdio: 'ignore', detached: true });
    hijo.on('error', () => {});
    hijo.unref();
  } catch {
    // Si no se puede abrir el navegador, el usuario puede entrar manualmente.
  }
}

function mensajeConexion(err, config) {
  if (err.code === 'ECONNREFUSED') {
    return [
      `No se pudo conectar a PostgreSQL en ${config.host}:${config.port}.`,
      '  1. Verifica que el servicio de PostgreSQL este iniciado.',
      '  2. En Windows abre "Servicios" y busca PostgreSQL.',
      '  3. En macOS o Linux inicia el servicio con tu gestor habitual.',
      '  4. Revisa el host y el puerto en backend/.env.'
    ].join('\n');
  }
  if (err.code === '28P01' || err.code === '28000') {
    return [
      `El usuario "${config.user}" o la contrasena no son correctos.`,
      '  Revisa PG_USER y PG_PASSWORD en backend/.env y vuelve a ejecutar la instalacion.'
    ].join('\n');
  }
  if (err.code === '3D000') {
    return `La base de datos "${config.database}" no existe. Ejecuta la instalacion para crearla.`;
  }
  if (err.code === '42501') {
    return [
      'El usuario de PostgreSQL no tiene permisos suficientes.',
      `  Crea la base "${config.database}" manualmente con pgAdmin o psql y vuelve a intentar.`
    ].join('\n');
  }
  return err.message;
}

module.exports = {
  ROOT,
  BACKEND,
  FRONTEND,
  BACKUPS,
  ENV_FILE,
  ENV_EXAMPLE,
  NPM,
  titulo,
  fail,
  checkNode,
  runNpm,
  parseEnv,
  readEnvFile,
  envValue,
  abrirNavegador,
  mensajeConexion
};
