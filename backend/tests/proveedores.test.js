/**
 * StockPlus - Pruebas de integracion del modulo de Proveedores
 * CRUD, permisos por rol y proteccion de productos asociados.
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

describe('Proveedores: CRUD /api/proveedores', () => {
  let tokenAdmin;
  let tokenVendedor;
  let usuarioAdmin;
  let usuarioVendedor;
  let idProveedor;
  let idProducto;

  beforeAll(async () => {
    usuarioAdmin = await crearUsuarioPrueba('administrador');
    usuarioVendedor = await crearUsuarioPrueba('vendedor');
    tokenAdmin = await iniciarSesion(usuarioAdmin);
    tokenVendedor = await iniciarSesion(usuarioVendedor);
  });

  afterAll(async () => {
    if (idProducto) {
      await limpiar([{ tabla: 'productos', columna: 'id_producto', id: idProducto }]);
    }
    if (idProveedor) {
      await limpiar([{ tabla: 'proveedores', columna: 'id_proveedor', id: idProveedor }]);
    }
    await limpiar([
      { tabla: 'usuarios', columna: 'id_usuario', id: usuarioAdmin.id },
      { tabla: 'usuarios', columna: 'id_usuario', id: usuarioVendedor.id }
    ]);
  });

  test('PR001 - Crear proveedor valido responde 201', async () => {
    const res = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: `Proveedor Test ${Date.now()}`,
        contacto: 'Contacto Test',
        telefono: '3001234567',
        direccion: 'Calle 1 #2-3'
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    idProveedor = res.body.id;
  });

  test('PR002 - Crear proveedor sin nombre responde 400', async () => {
    const res = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ contacto: 'Sin nombre' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('nombre');
  });

  test('PR003 - Un vendedor no puede crear proveedores (403)', async () => {
    const res = await request(app)
      .post('/api/proveedores')
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre: 'Proveedor Vendedor' });

    expect(res.status).toBe(403);
  });

  test('PR004 - Listar proveedores responde 200', async () => {
    const res = await request(app)
      .get('/api/proveedores')
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PR005 - Obtener proveedor por ID responde 200', async () => {
    const res = await request(app)
      .get(`/api/proveedores/${idProveedor}`)
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(200);
    expect(res.body.id_proveedor).toBe(idProveedor);
  });

  test('PR006 - Obtener proveedor inexistente responde 404', async () => {
    const res = await request(app)
      .get('/api/proveedores/999999')
      .set('Authorization', `Bearer ${tokenVendedor}`);

    expect(res.status).toBe(404);
  });

  test('PR007 - Actualizar proveedor responde 200', async () => {
    const res = await request(app)
      .put(`/api/proveedores/${idProveedor}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Proveedor Test Actualizado', telefono: '3109876543' });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('actualizado');
  });

  test('PR008 - Un vendedor no puede actualizar proveedores (403)', async () => {
    const res = await request(app)
      .put(`/api/proveedores/${idProveedor}`)
      .set('Authorization', `Bearer ${tokenVendedor}`)
      .send({ nombre: 'Intento Vendedor' });

    expect(res.status).toBe(403);
  });

  test('PR009 - No se puede eliminar un proveedor con productos (409)', async () => {
    idProducto = await crearProductoPrueba({ id_proveedor: idProveedor });

    const res = await request(app)
      .delete(`/api/proveedores/${idProveedor}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('productos asociados');
  });

  test('PR010 - Eliminar proveedor sin productos responde 200', async () => {
    await query('DELETE FROM productos WHERE id_producto = $1', [idProducto]);
    idProducto = null;

    const res = await request(app)
      .delete(`/api/proveedores/${idProveedor}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('eliminado');
    idProveedor = null;
  });

  test('PR011 - Acceso sin token responde 401', async () => {
    const res = await request(app).get('/api/proveedores');
    expect(res.status).toBe(401);
  });
});
