/**
 * StockPlus - Pruebas de integracion del modulo de Productos
 * CRUD, borrado logico, restauracion, busqueda y permisos por rol.
 */
const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/db');
const {
  crearUsuarioPrueba,
  iniciarSesion,
  crearProductoPrueba,
  limpiar
} = require('./helpers');

describe('Productos: CRUD /api/productos', () => {
  let token;
  let tokenVendedor;
  let usuarioAdmin;
  let usuarioVendedor;
  let idProducto;
  const idsProductos = [];

  beforeAll(async () => {
    usuarioAdmin = await crearUsuarioPrueba('administrador');
    usuarioVendedor = await crearUsuarioPrueba('vendedor');
    token = await iniciarSesion(usuarioAdmin);
    tokenVendedor = await iniciarSesion(usuarioVendedor);
  });

  afterAll(async () => {
    await limpiar([
      ...idsProductos.map(id => ({ tabla: 'productos', columna: 'id_producto', id })),
      { tabla: 'usuarios', columna: 'id_usuario', id: usuarioAdmin.id },
      { tabla: 'usuarios', columna: 'id_usuario', id: usuarioVendedor.id }
    ]);
  });

  test('P001 - Crear producto valido responde 201', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: `Laptop Test ${Date.now()}`, precio: 1500000, cantidad_stock: 15 });

    expect(res.status).toBe(201);
    expect(res.body.mensaje).toContain('creado');
    expect(res.body.id).toBeDefined();
    idProducto = res.body.id;
    idsProductos.push(idProducto);
  });

  test('P002 - Crear producto sin nombre responde 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ precio: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('nombre');
  });

  test('P003 - Crear producto con precio invalido responde 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Producto Sin Precio', precio: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('precio');
  });

  test('P004 - Crear producto con stock negativo responde 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Producto Stock Negativo', precio: 1000, cantidad_stock: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('stock');
  });

  test('P005 - Crear producto con proveedor inexistente responde 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Producto Proveedor Fantasma', precio: 1000, id_proveedor: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('proveedor');
  });

  test('P006 - Listar productos responde 200 con arreglo', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('P007 - Buscar productos por nombre', async () => {
    const res = await request(app)
      .get('/api/productos?buscar=Laptop Test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.some(p => p.id_producto === idProducto)).toBe(true);
  });

  test('P008 - Obtener producto por ID responde 200', async () => {
    const res = await request(app)
      .get(`/api/productos/${idProducto}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id_producto).toBe(idProducto);
  });

  test('P009 - Obtener producto inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/productos/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('no encontrado');
  });

  test('P010 - Obtener producto con ID invalido responde 400', async () => {
    const res = await request(app)
      .get('/api/productos/abc')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test('P011 - Actualizar producto responde 200', async () => {
    const res = await request(app)
      .put(`/api/productos/${idProducto}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Laptop Test Actualizada', precio: 1600000, cantidad_stock: 12, stock_minimo: 3 });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('actualizado');

    const check = await query('SELECT nombre FROM productos WHERE id_producto = $1', [idProducto]);
    expect(check.rows[0].nombre).toBe('Laptop Test Actualizada');
  });

  test('P012 - Ocultar producto responde 200 y lo marca inactivo', async () => {
    const res = await request(app)
      .delete(`/api/productos/${idProducto}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const check = await query('SELECT activo FROM productos WHERE id_producto = $1', [idProducto]);
    expect(check.rows[0].activo).toBe(false);
  });

  test('P013 - Listar sin ?todos=true excluye productos ocultos', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${token}`);

    const encontrado = res.body.find(p => p.id_producto === idProducto);
    expect(encontrado).toBeUndefined();
  });

  test('P014 - ?todos=true incluye productos ocultos', async () => {
    const res = await request(app)
      .get('/api/productos?todos=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.some(p => p.id_producto === idProducto && p.activo === false)).toBe(true);
  });

  test('P015 - Restaurar producto responde 200 y lo marca activo', async () => {
    const res = await request(app)
      .post(`/api/productos/${idProducto}/restaurar`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('restaurado');

    const check = await query('SELECT activo FROM productos WHERE id_producto = $1', [idProducto]);
    expect(check.rows[0].activo).toBe(true);
  });

  test('P016 - Endpoint stock-bajo responde 200 con arreglo', async () => {
    const idBajo = await crearProductoPrueba({ cantidad_stock: 1, stock_minimo: 10 });
    idsProductos.push(idBajo);

    const res = await request(app)
      .get('/api/productos/stock-bajo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(p => p.id_producto === idBajo)).toBe(true);
  });

  test('P017 - Un vendedor no puede crear productos (403)', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre: 'Producto Vendedor', precio: 1000 });

    expect(res.status).toBe(403);
  });

  test('P018 - Un vendedor no puede ocultar productos (403)', async () => {
    const res = await request(app)
      .delete(`/api/productos/${idProducto}`)
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(403);
  });

  test('P019 - Acceso sin token responde 401', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
  });
});
