/**
 * StockPlus - Backend API (Express.js)
 * Sistema de Gestión de Inventario
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { query } = require('./config/db');

// ── Importar rutas ──
const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const clienteRoutes = require('./routes/clientes');
const proveedorRoutes = require('./routes/proveedores');
const ventaRoutes = require('./routes/ventas');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// ── Middleware ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS Configuration ──
const corsOrigins = process.env.CORS_ORIGINS || '';
let originsList;

if (corsOrigins) {
  originsList = corsOrigins.split(',').map(o => o.trim()).filter(Boolean);
} else {
  // Desarrollo: permitir localhost en cualquier puerto
  originsList = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ];
}

app.use(cors({
  origin: originsList,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Health Check ──
app.get('/', (req, res) => {
  res.json({ status: 'ok', mensaje: 'StockPlus API' });
});

app.get('/api/ping', async (req, res) => {
  try {
    const productosResult = await query('SELECT COUNT(*) FROM productos');
    const usuariosResult = await query('SELECT COUNT(*) FROM usuarios');
    res.json({
      db: 'conectada',
      productos: parseInt(productosResult.rows[0].count, 10),
      usuarios: parseInt(usuariosResult.rows[0].count, 10)
    });
  } catch (err) {
    res.status(500).json({ db: 'ERROR', detalle: err.message });
  }
});

// ── Registrar rutas ──
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Manejador de errores global ──
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ── Manejador para rutas no encontradas ──
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Iniciar servidor ──
const PORT = parseInt(process.env.PORT || '5000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║        StockPlus Backend API          ║');
  console.log('║        Express.js + PostgreSQL         ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  URL:   http://localhost:${PORT}          ║`);
  console.log(`║  Ping:  http://localhost:${PORT}/api/ping ║`);
  console.log('║  Env:   ' + (process.env.NODE_ENV || 'development').padEnd(26) + '║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
