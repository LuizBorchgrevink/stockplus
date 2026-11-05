/**
 * StockPlus - Backend API (Express.js)
 * Sirve la API y, si existe el build del frontend, la aplicacion completa
 * desde un unico puerto para uso local.
 */
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { query, pool } = require('./config/db');

// ── Importar rutas ──
const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const clienteRoutes = require('./routes/clientes');
const proveedorRoutes = require('./routes/proveedores');
const ventaRoutes = require('./routes/ventas');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.disable('x-powered-by');

const isProduction = process.env.NODE_ENV === 'production';

// Detras de Nginx, Render o Railway, TRUST_PROXY=1 hace que req.ip y el
// rate limit usen la IP real del cliente y no la del proxy.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  const numericTrust = Number(trustProxy);
  app.set('trust proxy', Number.isInteger(numericTrust) ? numericTrust : trustProxy);
}

const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// ── Middleware de seguridad ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", ...corsOrigins],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      // En HTTP por red local el navegador subiria los assets a HTTPS y la
      // aplicacion quedaria en blanco. Cuando exista HTTPS, el proxy inverso
      // es quien debe redirigir de HTTP a HTTPS.
      upgradeInsecureRequests: null
    }
  },
  crossOriginEmbedderPolicy: false,
  // En HTTP por red local el navegador ignora estas dos cabeceras y llena
  // la consola de errores. La CSP y X-Frame-Options siguen activos.
  crossOriginOpenerPolicy: false,
  originAgentCluster: false
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de inicio de sesion. Espera 15 minutos e intenta de nuevo.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta conexion. Intenta mas tarde.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' }
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api', apiLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── CORS ──
const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin(origin, callback) {
    // Sin cabecera Origin = misma aplicacion o cliente no navegador.
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    if (!isProduction && localhostPattern.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Health check ──
async function healthCheck(req, res) {
  try {
    await query('SELECT 1');
    return res.json({
      status: 'ok',
      db: 'conectada',
      servicio: 'StockPlus API'
    });
  } catch (err) {
    console.error('Ping sin conexion a PostgreSQL:', err.message);
    return res.status(503).json({
      status: 'error',
      db: 'desconectada',
      error: 'No se pudo conectar a PostgreSQL. Verifica que el servicio este iniciado y que backend/.env tenga las credenciales correctas.'
    });
  }
}

app.get('/api/ping', healthCheck);
app.get('/healthz', healthCheck);

// ── Rutas de la API ──
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 para la API (antes del fallback del SPA) ──
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// ── Frontend compilado (opcional) ──
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
const frontendIndex = path.join(frontendDist, 'index.html');
const frontendDisponible = fs.existsSync(frontendIndex);

if (frontendDisponible) {
  app.use(express.static(frontendDist, { index: false, maxAge: isProduction ? '1h' : 0 }));
  app.get('*', (req, res) => {
    res.sendFile(frontendIndex);
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      servicio: 'StockPlus API',
      mensaje: 'El frontend no esta compilado. Ejecuta npm run build o usa npm run dev.',
      ping: '/api/ping'
    });
  });
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });
}

// ── Manejador de errores global ──
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON valido' });
  }

  console.error('Error no manejado:', err && err.stack ? err.stack : err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Iniciar servidor (solo si se ejecuta directamente) ──
const PORT = parseInt(process.env.PORT || '5000', 10);

if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('==========================================');
    console.log('           StockPlus iniciado');
    console.log('==========================================');
    console.log(`  Aplicacion: http://localhost:${PORT}`);
    console.log(`  Estado:     http://localhost:${PORT}/api/ping`);
    console.log(`  Entorno:    ${process.env.NODE_ENV || 'development'}`);
    if (!frontendDisponible) {
      console.log('  Aviso: frontend/dist no existe; solo esta activa la API.');
    }
    console.log('  Para detener: Ctrl + C');
    console.log('==========================================');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('');
      console.error(`El puerto ${PORT} ya esta en uso.`);
      console.error('Cierra la otra aplicacion o cambia PORT en backend/.env.');
      process.exit(1);
    }
    console.error('No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} recibido. Cerrando StockPlus...`);
    const forceExit = setTimeout(() => {
      console.error('Cierre forzado tras 8 segundos.');
      process.exit(1);
    }, 8000);
    forceExit.unref();

    server.close(async () => {
      try {
        await pool.end();
      } catch (err) {
        console.error('Error cerrando el pool de PostgreSQL:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = app;
