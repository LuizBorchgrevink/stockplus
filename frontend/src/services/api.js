const BASE_URL = 'http://localhost:5000/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)
  const data = await res.json()

  if (!res.ok) throw new Error(data.error || 'Error en la solicitud')
  return data
}

export const api = {
  // Auth
  login: (correo, contrasena) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    }).then(r => r.json()),

  register: (data) =>
    fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  // Dashboard
  getDashboard: () => request('GET', '/dashboard/stats'),

  // Productos
  getProductos: () => request('GET', '/productos/'),
  createProducto: (data) => request('POST', '/productos/', data),
  updateProducto: (id, data) => request('PUT', `/productos/${id}`, data),
  deleteProducto: (id) => request('DELETE', `/productos/${id}`),

  // Clientes
  getClientes: () => request('GET', '/clientes/'),
  createCliente: (data) => request('POST', '/clientes/', data),
  updateCliente: (id, data) => request('PUT', `/clientes/${id}`, data),
  deleteCliente: (id) => request('DELETE', `/clientes/${id}`),

  // Proveedores
  getProveedores: () => request('GET', '/proveedores/'),
  createProveedor: (data) => request('POST', '/proveedores/', data),
  updateProveedor: (id, data) => request('PUT', `/proveedores/${id}`, data),
  deleteProveedor: (id) => request('DELETE', `/proveedores/${id}`),

  // Ventas
  getVentas: () => request('GET', '/ventas/'),
  getVenta: (id) => request('GET', `/ventas/${id}`),
  createVenta: (data) => request('POST', '/ventas/', data),
}
