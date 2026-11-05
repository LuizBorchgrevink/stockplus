/**
 * StockPlus - Pruebas de integracion del modulo de Clientes
 * CRUD, validaciones, busqueda, permisos y proteccion del historial de ventas.
 */
const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/config/db');
const {
  crearUsuarioPrueba,
  iniciarSesion,
  crearClientePrueba,
  limpiar
} = require('./helpers');

describe('Clientes: CRUD /api/clientes', () => {
  let tokenAdmin;
  let tokenVendedor;
  let usuarioAdmin;
  let usuarioVendedor;
  let idCliente;
  let idVentaConCliente;
  const idsClientes = [];

  beforeAll(async () => {
    usuarioAdmin = await crearUsuarioPrueba('administrador');
    usuarioVendedor = await crearUsuarioPrueba('vendedor');
    tokenAdmin = await iniciarSesion(usuarioAdmin);
    tokenVendedor = await iniciarSesion(usuarioVendedor);
  });

  afterAll(async () => {
    if (idVentaConCliente) {
      await limpiar([{ tabla: 'ventas', columna: 'id_venta', id: idVentaConCliente }]);
    }
    await limpiar([
      ...idsClientes.map(id => ({ tabla: 'clientes', columna: 'id_cliente', id })),
      { tabla: 'usuarios', columna: 'id_usuario', id: usuarioAdmin.id },
      { tabla: 'usuarios', columna: 'id_usuario', id: usuarioVendedor.id }
    ]);
  });

  test('CL001 - Crear cliente valido responde 201', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({
        nombre: `Cliente Prueba ${Date.now()}`,
        correo: `c${Date.now()}@test.com`,
        telefono: '3000000000'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    idCliente = res.body.id;
    idsClientes.push(idCliente);
  });

  test('CL002 - Crear cliente sin nombre responde 400', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ correo: 'sin-nombre@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('nombre');
  });

  test('CL003 - Crear cliente con correo invalido responde 400', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre: 'Correo Malo', correo: 'sin-arroba' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('correo');
  });

  test('CL004 - Listar clientes responde 200', async () => {
    const res = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('CL005 - Buscar clientes por nombre', async () => {
    const nombre = (await query('SELECT nombre FROM clientes WHERE id_cliente = $1', [idCliente]))
      .rows[0].nombre;

    const res = await request(app)
      .get(`/api/clientes?buscar=${encodeURIComponent(nombre)}`)
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.some(c => c.id_cliente === idCliente)).toBe(true);
  });

  test('CL006 - Obtener cliente por ID responde 200', async () => {
    const res = await request(app)
      .get(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.id_cliente).toBe(idCliente);
  });

  test('CL007 - Obtener cliente inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/clientes/999999')
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(404);
  });

  test('CL008 - Actualizar cliente responde 200', async () => {
    const res = await request(app)
      .put(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre: 'Cliente Prueba Modificado', telefono: '3111111111' });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('actualizado');
  });

  test('CL009 - Un vendedor no puede eliminar clientes (403)', async () => {
    const res = await request(app)
      .delete(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(403);
  });

  test('CL010 - Eliminar cliente sin ventas responde 200', async () => {
    const nuevo = await crearClientePrueba();
    idsClientes.push(nuevo);

    const res = await request(app)
      .delete(`/api/clientes/${nuevo}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('eliminado');
  });

  test('CL011 - No se puede eliminar un cliente con ventas (409)', async () => {
    const venta = await query(
      'INSERT INTO ventas (id_cliente, total) VALUES ($1, 0) RETURNING id_venta',
      [idCliente]
    );
    idVentaConCliente = venta.rows[0].id_venta;

    const res = await request(app)
      .delete(`/api/clientes/${idCliente}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('ventas registradas');
  });

  test('CL012 - Acceso sin token responde 401', async () => {
    const res = await request(app).get('/api/clientes');
    expect(res.status).toBe(401);
  });
});
