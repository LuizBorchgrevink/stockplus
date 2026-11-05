/**
 * StockPlus - Pruebas de integracion del modulo de Ventas
 * Transacciones, precios del servidor, stock, lineas duplicadas y permisos.
 */
const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/db');
const {
  crearUsuarioPrueba,
  iniciarSesion,
  crearProductoPrueba,
  crearClientePrueba,
  limpiar
} = require('./helpers');

describe('Ventas: /api/ventas', () => {
  let token;
  let tokenAdmin;
  let usuario;
  let usuarioAdmin;
  let idCliente;
  let idProducto;
  let idProductoOculto;
  let idVenta;
  const idsVentas = [];
  const idsClientes = [];
  const idsProductos = [];

  beforeAll(async () => {
    usuario = await crearUsuarioPrueba('vendedor');
    usuarioAdmin = await crearUsuarioPrueba('administrador');
    token = await iniciarSesion(usuario);
    tokenAdmin = await iniciarSesion(usuarioAdmin);

    idCliente = await crearClientePrueba();
    idsClientes.push(idCliente);

    idProducto = await crearProductoPrueba({ precio: 5000, cantidad_stock: 30, stock_minimo: 5 });
    idsProductos.push(idProducto);

    idProductoOculto = await crearProductoPrueba({ precio: 2000, cantidad_stock: 10 });
    idsProductos.push(idProductoOculto);

    await request(app)
      .delete(`/api/productos/${idProductoOculto}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
  });

  afterAll(async () => {
    await limpiar([
      ...idsVentas.map(id => ({ tabla: 'detalle_venta', columna: 'id_venta', id })),
      ...idsVentas.map(id => ({ tabla: 'ventas', columna: 'id_venta', id })),
      ...idsProductos.map(id => ({ tabla: 'productos', columna: 'id_producto', id })),
      ...idsClientes.map(id => ({ tabla: 'clientes', columna: 'id_cliente', id })),
      { tabla: 'usuarios', columna: 'id_usuario', id: usuario.id },
      { tabla: 'usuarios', columna: 'id_usuario', id: usuarioAdmin.id }
    ]);
  });

  test('V001 - La venta usa el precio de la base y no el enviado por el cliente', async () => {
    const stockAntes = (await query('SELECT cantidad_stock FROM productos WHERE id_producto = $1', [idProducto])).rows[0].cantidad_stock;

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [{ id_producto: idProducto, cantidad: 5, precio_unitario: 1 }]
      });

    expect(res.status).toBe(201);
    expect(res.body.id_venta).toBeDefined();
    expect(Number(res.body.total)).toBe(25000);
    idVenta = res.body.id_venta;
    idsVentas.push(idVenta);

    const stockDespues = (await query('SELECT cantidad_stock FROM productos WHERE id_producto = $1', [idProducto])).rows[0].cantidad_stock;
    expect(stockDespues).toBe(stockAntes - 5);

    const detalle = await query(
      'SELECT precio_unitario, cantidad FROM detalle_venta WHERE id_venta = $1',
      [idVenta]
    );
    expect(Number(detalle.rows[0].precio_unitario)).toBe(5000);
    expect(detalle.rows[0].cantidad).toBe(5);
  });

  test('V002 - Venta sin productos responde 400', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_cliente: idCliente, productos: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('al menos un producto');
  });

  test('V003 - Venta con stock insuficiente responde 409 y NO descuenta', async () => {
    const stockAntes = (await query('SELECT cantidad_stock FROM productos WHERE id_producto = $1', [idProducto])).rows[0].cantidad_stock;

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [{ id_producto: idProducto, cantidad: 9999 }]
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('Stock insuficiente');

    const stockDespues = (await query('SELECT cantidad_stock FROM productos WHERE id_producto = $1', [idProducto])).rows[0].cantidad_stock;
    expect(stockDespues).toBe(stockAntes);
  });

  test('V004 - Venta con producto inexistente responde 404', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [{ id_producto: 999999, cantidad: 1 }]
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('no existe');
  });

  test('V005 - Venta con producto oculto responde 400', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [{ id_producto: idProductoOculto, cantidad: 1 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('no esta disponible');
  });

  test('V006 - Venta con cantidad invalida responde 400', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [{ id_producto: idProducto, cantidad: 0 }]
      });

    expect(res.status).toBe(400);
  });

  test('V007 - Cantidad fraccionaria responde 400', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [{ id_producto: idProducto, cantidad: 1.5 }]
      });

    expect(res.status).toBe(400);
  });

  test('V008 - Venta con cliente inexistente responde 404', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: 999999,
        productos: [{ id_producto: idProducto, cantidad: 1 }]
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('cliente');
  });

  test('V009 - Las lineas duplicadas se agrupan y descuentan el stock real', async () => {
    const stockAntes = (await query('SELECT cantidad_stock FROM productos WHERE id_producto = $1', [idProducto])).rows[0].cantidad_stock;

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [
          { id_producto: idProducto, cantidad: 2 },
          { id_producto: idProducto, cantidad: 3 }
        ]
      });

    expect(res.status).toBe(201);
    expect(Number(res.body.total)).toBe(25000);
    idsVentas.push(res.body.id_venta);

    const stockDespues = (await query('SELECT cantidad_stock FROM productos WHERE id_producto = $1', [idProducto])).rows[0].cantidad_stock;
    expect(stockDespues).toBe(stockAntes - 5);

    const detalle = await query(
      'SELECT cantidad FROM detalle_venta WHERE id_venta = $1',
      [res.body.id_venta]
    );
    expect(detalle.rowCount).toBe(1);
    expect(detalle.rows[0].cantidad).toBe(5);
  });

  test('V010 - Listar ventas responde 200', async () => {
    const res = await request(app)
      .get('/api/ventas')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(v => v.id_venta === idVenta)).toBe(true);
  });

  test('V011 - Obtener venta por ID incluye detalles', async () => {
    const res = await request(app)
      .get(`/api/ventas/${idVenta}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id_venta).toBe(idVenta);
    expect(res.body.cliente_nombre).toBeDefined();
    expect(Array.isArray(res.body.detalles)).toBe(true);
    expect(res.body.detalles.length).toBeGreaterThanOrEqual(1);
  });

  test('V012 - Obtener venta inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/ventas/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('V013 - Venta sin cliente responde 201 (consumidor final)', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({ productos: [{ id_producto: idProducto, cantidad: 1 }] });

    expect(res.status).toBe(201);
    expect(Number(res.body.total)).toBe(5000);
    idsVentas.push(res.body.id_venta);
  });

  test('V014 - Acceso sin token responde 401', async () => {
    const res = await request(app).get('/api/ventas');
    expect(res.status).toBe(401);
  });
});
