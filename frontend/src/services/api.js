/**
 * StockPlus - API Service Layer
 * Todas las peticiones al backend se hacen a través de este servicio.
 * En desarrollo usa el proxy de Vite (/api -> backend:5000)
 * En producción usa Nginx para el mismo propósito.
 */
const getBaseUrl = () => '/api'

function getToken() {
  return localStorage.getItem('token')
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

  const res = await fetch(`${getBaseUrl()}${path}`, options)

  // Manejar token expirado
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    window.location.href = '/login'
    throw new Error('Sesión expirada. Inicia sesión nuevamente.')
  }

  const data = await res.json()

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
  getVentas: () => request('GET', '/ventas'),
  getVenta: (id) => request('GET', `/ventas/${id}`),
  createVenta: (data) => request('POST', '/ventas', data),
}
