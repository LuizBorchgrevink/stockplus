/**
 * StockPlus - API Service Layer
 * En desarrollo usa el proxy de Vite (/api -> backend:5000).
 * En la build local el frontend y la API comparten el mismo puerto.
 * VITE_API_URL permite apuntar a otro servidor si fuese necesario.
 */
const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export const API_URL = API_BASE_URL

function getToken() {
  return localStorage.getItem('token')
}

function esRutaDeSesion(path) {
  return path === '/auth/login' || path === '/auth/register'
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, options)
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que StockPlus esté iniciado.')
  }

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  // Solo cierra la sesión si el token existía y el fallo no es del propio login.
  if (res.status === 401 && token && !esRutaDeSesion(path)) {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    window.dispatchEvent(new Event('stockplus:unauthorized'))
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.')
  }

  if (!res.ok) {
    throw new Error(data.error || 'Error en la solicitud')
  }

  return data
}

export const api = {
  // ── Auth ──
  login: (correo, contrasena) =>
    request('POST', '/auth/login', { correo, contrasena }),

  register: (data) =>
    request('POST', '/auth/register', data),

  getMe: () =>
    request('GET', '/auth/me'),

  cambiarPassword: (actual, nueva) =>
    request('PUT', '/auth/password', { actual, nueva }),

  // ── Dashboard ──
  getDashboard: () => request('GET', '/dashboard/stats'),

  // ── Productos ──
  getProductos: (todos = false) => request('GET', `/productos${todos ? '?todos=true' : ''}`),
  getProducto: (id) => request('GET', `/productos/${id}`),
  createProducto: (data) => request('POST', '/productos', data),
  updateProducto: (id, data) => request('PUT', `/productos/${id}`, data),
  ocultarProducto: (id) => request('DELETE', `/productos/${id}`),
  restaurarProducto: (id) => request('POST', `/productos/${id}/restaurar`),
  getStockBajo: () => request('GET', '/productos/stock-bajo'),

  // ── Clientes ──
  getClientes: () => request('GET', '/clientes'),
  getCliente: (id) => request('GET', `/clientes/${id}`),
  createCliente: (data) => request('POST', '/clientes', data),
  updateCliente: (id, data) => request('PUT', `/clientes/${id}`, data),
  deleteCliente: (id) => request('DELETE', `/clientes/${id}`),

  // ── Proveedores ──
  getProveedores: () => request('GET', '/proveedores'),
  getProveedor: (id) => request('GET', `/proveedores/${id}`),
  createProveedor: (data) => request('POST', '/proveedores', data),
  updateProveedor: (id, data) => request('PUT', `/proveedores/${id}`, data),
  deleteProveedor: (id) => request('DELETE', `/proveedores/${id}`),

  // ── Ventas ──
  getVentas: (limite = 50) => request('GET', `/ventas?limite=${limite}`),
  getVenta: (id) => request('GET', `/ventas/${id}`),
  createVenta: (data) => request('POST', '/ventas', data),
}
