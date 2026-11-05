/**
 * StockPlus - Pruebas de integracion del modulo de Autenticacion
 * Registro, login, identidad, expiracion del token y cambio de contrasena.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const { query } = require('../src/config/db');
const { SUFFIX, limpiar } = require('./helpers');

describe('Auth: POST /api/auth/register', () => {
  const correo = `registro_${SUFFIX}@stockplus.test`;
  let idUsuario;

  afterAll(async () => {
    await limpiar([{ tabla: 'usuarios', columna: 'id_usuario', id: idUsuario }]);
  });

  test('C001 - Registro exitoso responde 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Usuario Test', correo, contrasena: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.mensaje).toContain('registrado');
    expect(res.body.id).toBeDefined();
    idUsuario = res.body.id;
  });

  test('C002 - Registro sin todos los campos responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: '', correo: '', contrasena: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('requeridos');
  });

  test('C003 - Contrasena menor a 8 caracteres responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Usuario', correo: `corta_${SUFFIX}@test.com`, contrasena: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('8 y 72');
  });

  test('C004 - Correo invalido responde 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Usuario', correo: 'correo-sin-arroba', contrasena: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('correo');
  });

  test('C005 - Correo duplicado responde 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Usuario Test', correo, contrasena: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('Auth: POST /api/auth/login', () => {
  const correo = `login_${SUFFIX}@stockplus.test`;
  let idUsuario;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Login Test', correo, contrasena: 'password123' })
      .expect(201);
    const r = await query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
    idUsuario = r.rows[0].id_usuario;
  });

  afterAll(async () => {
    await limpiar([{ tabla: 'usuarios', columna: 'id_usuario', id: idUsuario }]);
  });

  test('C006 - Login exitoso devuelve token y usuario', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario.correo).toBe(correo);
    expect(res.body.usuario.rol).toBe('vendedor');
  });

  test('C007 - El token incluye expiracion', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'password123' });

    const payload = jwt.decode(res.body.token);
    expect(payload.exp).toBeDefined();
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  test('C008 - El correo se normaliza a minusculas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: correo.toUpperCase(), contrasena: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.usuario.correo).toBe(correo);
  });

  test('C009 - Login con contrasena incorrecta responde 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'clave-incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Credenciales incorrectas');
  });

  test('C010 - Login de usuario inexistente responde 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: `nadie_${SUFFIX}@stockplus.test`, contrasena: 'password123' });

    expect(res.status).toBe(401);
  });

  test('C011 - Login sin credenciales responde 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Auth: GET /api/auth/me', () => {
  const correo = `me_${SUFFIX}@stockplus.test`;
  let idUsuario;
  let token;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Me Test', correo, contrasena: 'password123' })
      .expect(201);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'password123' });
    token = loginRes.body.token;
    const r = await query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
    idUsuario = r.rows[0].id_usuario;
  });

  afterAll(async () => {
    await limpiar([{ tabla: 'usuarios', columna: 'id_usuario', id: idUsuario }]);
  });

  test('C012 - Devuelve la identidad del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Me Test');
    expect(res.body.rol).toBe('vendedor');
  });

  test('C013 - Sin token responde 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('C014 - Token invalido responde 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
  });
});

describe('Auth: PUT /api/auth/password', () => {
  const correo = `clave_${SUFFIX}@stockplus.test`;
  let idUsuario;
  let token;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Clave Test', correo, contrasena: 'password123' })
      .expect(201);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'password123' });
    token = loginRes.body.token;
    const r = await query('SELECT id_usuario FROM usuarios WHERE correo = $1', [correo]);
    idUsuario = r.rows[0].id_usuario;
  });

  afterAll(async () => {
    await limpiar([{ tabla: 'usuarios', columna: 'id_usuario', id: idUsuario }]);
  });

  test('C015 - Contrasena actual incorrecta responde 400', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ actual: 'incorrecta', nueva: 'nuevaClave123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('actual no es correcta');
  });

  test('C016 - Nueva contrasena demasiado corta responde 400', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ actual: 'password123', nueva: 'corta' });

    expect(res.status).toBe(400);
  });

  test('C017 - Cambio exitoso permite iniciar sesion con la nueva clave', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ actual: 'password123', nueva: 'nuevaClave123' });

    expect(res.status).toBe(200);
    expect(res.body.mensaje).toContain('actualizada');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: 'nuevaClave123' });

    expect(login.status).toBe(200);
  });

  test('C018 - Sin token responde 401', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .send({ actual: 'x', nueva: 'y' });

    expect(res.status).toBe(401);
  });
});
