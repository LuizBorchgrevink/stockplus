/**
 * StockPlus - Helpers para pruebas de integración (Jest + Supertest)
 * Proporciona utilidades para crear usuarios, tokens y limpiar datos.
 */
const { query } = require('../src/config/db');

// Sufijo único por ejecución para evitar colisiones en la base de datos
const SUFFIX = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

/**
 * Crea un usuario de prueba y devuelve { correo, contrasena, id }
 */
async function crearUsuarioPrueba(rol = 'vendedor') {
  const correo = `test_${SUFFIX}_${rol}@stockplus.test`;
  const contrasena = 'testpass123';
  const { pool } = require('../src/config/db');
  const bcrypt = require('bcryptjs');

  const hashed = await bcrypt.hash(contrasena, 4); // rounds bajos para rapidez
  const result = await pool.query(
    'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, $4) RETURNING id_usuario',
    [`Test ${rol}`, correo, hashed, rol]
  );
  return { id: result.rows[0].id_usuario, correo, contrasena, rol };
}

/**
 * Inicia sesion con un usuario de prueba y devuelve el token JWT.
 */
async function iniciarSesion(usuario) {
  const request = require('supertest');
  const app = require('../src/app');

  const res = await request(app)
    .post('/api/auth/login')
    .send({ correo: usuario.correo, contrasena: usuario.contrasena });

  return res.body.token;
}

/**
 * Crea un proveedor de prueba y devuelve su id_proveedor
 */
async function crearProveedorPrueba() {
  const result = await query(
    'INSERT INTO proveedores (nombre, contacto) VALUES ($1, $2) RETURNING id_proveedor',
    [`Proveedor Test ${SUFFIX}`, 'Contacto Test']
  );
  return result.rows[0].id_proveedor;
}

/**
 * Crea un producto de prueba y devuelve su id_producto
 */
async function crearProductoPrueba(overrides = {}) {
  const nombre = overrides.nombre || `Producto Test ${SUFFIX}`;
  const result = await query(
    `INSERT INTO productos (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, activo)
     VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id_producto`,
    [
      nombre,
      overrides.descripcion || 'Producto creado por pruebas',
      overrides.precio || 1000,
      overrides.cantidad_stock !== undefined ? overrides.cantidad_stock : 20,
      overrides.stock_minimo !== undefined ? overrides.stock_minimo : 5,
      overrides.id_proveedor || null
    ]
  );
  return result.rows[0].id_producto;
}

/**
 * Crea un cliente de prueba y devuelve su id_cliente
 */
async function crearClientePrueba() {
  const result = await query(
    'INSERT INTO clientes (nombre, correo) VALUES ($1, $2) RETURNING id_cliente',
    [`Cliente Test ${SUFFIX}`, `cliente_${SUFFIX}@stockplus.test`]
  );
  return result.rows[0].id_cliente;
}

/**
 * Limpia los registros creados por las pruebas.
 * Recibe un array de { tabla, columna, id }.
 */
async function limpiar(registros = []) {
  for (const r of registros) {
    if (!r || r.id === undefined) continue;
    try {
      await query(`DELETE FROM ${r.tabla} WHERE ${r.columna} = $1`, [r.id]);
    } catch (err) {
      // Ignorar errores de limpieza (p.ej. restricciones de llave foránea ya resueltas)
      console.warn(`Limpieza omitida ${r.tabla} #${r.id}: ${err.message}`);
    }
  }
}

module.exports = {
  SUFFIX,
  crearUsuarioPrueba,
  iniciarSesion,
  crearProveedorPrueba,
  crearProductoPrueba,
  crearClientePrueba,
  limpiar
};
