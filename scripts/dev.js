/**
 * StockPlus - Modo desarrollo.
 * Inicia la API (con recarga automatica) y la web de Vite en paralelo.
 */
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const {
  BACKEND,
  FRONTEND,
  ENV_FILE,
  NPM,
  fail,
  readEnvFile
} = require('./lib');

const hijos = [];
let cerrando = false;

function detener(codigo = 0) {
  if (cerrando) return;
  cerrando = true;

  for (const hijo of hijos) {
    if (hijo.exitCode !== null) continue;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(hijo.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      try {
        process.kill(-hijo.pid, 'SIGTERM');
      } catch {
        hijo.kill('SIGTERM');
      }
    }
  }

  setTimeout(() => process.exit(codigo), 700);
}

function iniciar(nombre, cwd, args, extraEnv = {}) {
  const esWindows = process.platform === 'win32';
  const hijo = esWindows
    ? spawn('cmd.exe', ['/d', '/s', '/c', [NPM, ...args].join(' ')], {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, ...extraEnv }
      })
    : spawn(NPM, args, {
        cwd,
        stdio: 'inherit',
        detached: true,
        env: { ...process.env, ...extraEnv }
      });

  hijo.on('error', (err) => {
    console.error(`\nNo se pudo iniciar ${nombre}: ${err.message}`);
    detener(1);
  });

  hijo.on('exit', (codigo) => {
    if (cerrando) return;
    console.error(`\n${nombre} termino inesperadamente (codigo ${codigo}).`);
    detener(codigo || 1);
  });

  hijos.push(hijo);
}

function main() {
  if (!fs.existsSync(ENV_FILE)) {
    fail(
      'Falta el archivo de configuracion backend/.env.',
      'Ejecuta primero la instalacion:  npm run setup  (o SETUP.bat en Windows).'
    );
  }
  if (!fs.existsSync(path.join(BACKEND, 'node_modules', 'nodemon'))) {
    fail(
      'Faltan las dependencias del backend.',
      'Ejecuta la instalacion:  npm run setup  (o SETUP.bat en Windows).'
    );
  }
  if (!fs.existsSync(path.join(FRONTEND, 'node_modules', 'vite'))) {
    fail(
      'Faltan las dependencias del frontend.',
      'Ejecuta la instalacion:  npm run setup  (o SETUP.bat en Windows).'
    );
  }

  const env = readEnvFile(ENV_FILE);
  const puertoApi = Number(process.env.PORT || env.PORT || 5000);

  console.log('Iniciando StockPlus en modo desarrollo...');
  console.log(`  API:  http://localhost:${puertoApi}`);
  console.log('  Web:  http://localhost:5173');
  console.log('  Detener: Ctrl + C\n');

  iniciar('API', BACKEND, ['run', 'dev'], { NODE_ENV: 'development', PORT: String(puertoApi) });
  iniciar('Web', FRONTEND, ['run', 'dev', '--', '--port', '5173', '--strictPort']);

  process.on('SIGINT', () => detener(0));
  process.on('SIGTERM', () => detener(0));
}

main();
