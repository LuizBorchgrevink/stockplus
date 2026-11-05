/**
 * StockPlus - Pruebas de integracion del Dashboard
 * Verifica metricas reales, series de tiempo y productos destacados.
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

describe('Dashboard: GET /api/dashboard/stats', () => {
  let token;
  let usuario;
  let idCliente;
  let idProducto;
  let idProductoBajo;
  let idVenta;

  beforeAll(async () => {
    usuario = await crearUsuarioPrueba('vendedor');
    token = await iniciarSesion(usuario);

    idCliente = await crearClientePrueba();
    idProducto = await crearProductoPrueba({ precio: 1000, cantidad_stock: 20, stock_minimo: 5 });
    idProductoBajo = await crearProductoPrueba({ precio: 500, cantidad_stock: 1, stock_minimo: 10 });

    const venta = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id_cliente: idCliente,
        productos: [{ id_producto: idProducto, cantidad: 3 }]
      });

    idVenta = venta.body.id_venta;
  });

  afterAll(async () => {
    if (idVenta) {
      await limpiar([
        { tabla: 'detalle_venta', columna: 'id_venta', id: idVenta },
        { tabla: 'ventas', columna: 'id_venta', id: idVenta }
      ]);
    }
    await limpiar([
      { tabla: 'productos', columna: 'id_producto', id: idProducto },
      { tabla: 'productos', columna: 'id_producto', id: idProductoBajo },
      { tabla: 'clientes', columna: 'id_cliente', id: idCliente },
      { tabla: 'usuarios', columna: 'id_usuario', id: usuario.id }
    ]);
  });

  test('D001 - Devuelve las metricas del negocio', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total_productos).toBeGreaterThanOrEqual(2);
    expect(res.body.valor_inventario).toBeGreaterThan(0);
    expect(res.body.total_clientes).toBeGreaterThanOrEqual(1);
    expect(res.body.total_usuarios).toBeGreaterThanOrEqual(1);
    expect(res.body.unidades_stock).toBeGreaterThanOrEqual(0);
    expect(res.body.ventas_semana.cantidad).toBeGreaterThanOrEqual(1);
    expect(res.body.ventas_mes.monto).toBeGreaterThanOrEqual(3000);
    expect(res.body.unidades_vendidas_semana).toBeGreaterThanOrEqual(3);
  });

  test('D002 - Incluye productos con stock bajo', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.alertas_stock).toBeGreaterThanOrEqual(1);
    expect(res.body.productos_stock_bajo.some(p => p.id_producto === idProductoBajo)).toBe(true);
  });

  test('D003 - Incluye el top de productos vendidos', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    const top = res.body.top_productos.find(p => p.id_producto === idProducto);
    expect(top).toBeDefined();
    expect(top.unidades).toBe(3);
  });

  test('D004 - La grafica semanal tiene 7 dias y la mensual 6 meses', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.ventas_grafica).toHaveLength(7);
    expect(res.body.ventas_mensuales).toHaveLength(6);
    expect(res.body.ventas_mensuales[5].cantidad).toBeGreaterThanOrEqual(1);
  });

  test('D005 - Los productos ocultos no cuentan en el inventario', async () => {
    await query('UPDATE productos SET activo = false WHERE id_producto = $1', [idProductoBajo]);

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.productos_stock_bajo.some(p => p.id_producto === idProductoBajo)).toBe(false);

    await query('UPDATE productos SET activo = true WHERE id_producto = $1', [idProductoBajo]);
  });

  test('D006 - Acceso sin token responde 401', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
  });
});
