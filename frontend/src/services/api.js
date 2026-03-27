// api.js – Versión DEMO (sin backend)
// Simula las respuestas del servidor con datos de ejemplo

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

const productos = [
  { id_producto: 1, nombre: 'Camiseta Básica', descripcion: 'Algodón 100%', precio: 35000, cantidad_stock: 120, stock_minimo: 10, proveedor_nombre: 'Textiles del Valle' },
  { id_producto: 2, nombre: 'Pantalón Jean', descripcion: 'Slim fit azul', precio: 89000, cantidad_stock: 4, stock_minimo: 5, proveedor_nombre: 'Jeans Colombia' },
  { id_producto: 3, nombre: 'Chaqueta Deportiva', descripcion: 'Impermeable', precio: 145000, cantidad_stock: 0, stock_minimo: 3, proveedor_nombre: 'SportWear SAS' },
  { id_producto: 4, nombre: 'Zapatos Cuero', descripcion: 'Talla 40-45', precio: 210000, cantidad_stock: 22, stock_minimo: 5, proveedor_nombre: 'Calzado Medellín' },
]

const clientes = [
  { id_cliente: 1, nombre: 'Carlos Ramírez', correo: 'carlos@gmail.com', telefono: '3001234567' },
  { id_cliente: 2, nombre: 'Sofía Herrera', correo: 'sofia@gmail.com', telefono: '3107654321' },
  { id_cliente: 3, nombre: 'Andres Gómez', correo: 'andres@gmail.com', telefono: '3209876543' },
]

const proveedores = [
  { id_proveedor: 1, nombre: 'Textiles del Valle', contacto: 'Juan López', telefono: '6042345678', direccion: 'Cali, Colombia' },
  { id_proveedor: 2, nombre: 'Jeans Colombia', contacto: 'María Pérez', telefono: '6014567890', direccion: 'Bogotá, Colombia' },
  { id_proveedor: 3, nombre: 'SportWear SAS', contacto: 'Pedro Villa', telefono: '6046789012', direccion: 'Medellín, Colombia' },
  { id_proveedor: 4, nombre: 'Calzado Medellín', contacto: 'Ana Torres', telefono: '6043456789', direccion: 'Medellín, Colombia' },
]

const ventas = [
  { id_venta: 1, fecha: '2026-03-20', total: 270000, cliente_nombre: 'Carlos Ramírez' },
  { id_venta: 2, fecha: '2026-03-22', total: 89000,  cliente_nombre: 'Sofía Herrera' },
  { id_venta: 3, fecha: '2026-03-25', total: 145000, cliente_nombre: 'Andres Gómez' },
]

export const api = {
  // Auth – acepta cualquier correo/contraseña
  login: async (correo, contrasena) => {
    await delay()
    return {
      token: 'demo-token-123',
      usuario: { nombre: 'Admin Demo', rol: 'administrador' }
    }
  },

  register: async (data) => {
    await delay()
    return { mensaje: 'Cuenta creada exitosamente' }
  },

  // Dashboard
  getDashboard: async () => {
    await delay()
    return {
      total_productos: productos.length,
      valor_inventario: productos.reduce((s, p) => s + p.precio * p.cantidad_stock, 0),
      alertas_stock: productos.filter(p => p.cantidad_stock <= p.stock_minimo).length,
      ventas_semana: { cantidad: ventas.length },
      productos_stock_bajo: [...productos].sort((a, b) => a.cantidad_stock - b.cantidad_stock),
      ventas_grafica: [
        { dia: '2026-03-21', monto: 125000 },
        { dia: '2026-03-22', monto: 89000 },
        { dia: '2026-03-23', monto: 210000 },
        { dia: '2026-03-24', monto: 75000 },
        { dia: '2026-03-25', monto: 310000 },
        { dia: '2026-03-26', monto: 145000 },
      ]
    }
  },

  // Productos
  getProductos: async () => { await delay(); return [...productos] },
  createProducto: async (data) => { await delay(); productos.push({ ...data, id_producto: Date.now(), proveedor_nombre: '-' }); return {} },
  updateProducto: async (id, data) => { await delay(); const i = productos.findIndex(p => p.id_producto === id); if (i >= 0) productos[i] = { ...productos[i], ...data }; return {} },
  deleteProducto: async (id) => { await delay(); const i = productos.findIndex(p => p.id_producto === id); if (i >= 0) productos.splice(i, 1); return {} },

  // Clientes
  getClientes: async () => { await delay(); return [...clientes] },
  createCliente: async (data) => { await delay(); clientes.push({ ...data, id_cliente: Date.now() }); return {} },
  updateCliente: async (id, data) => { await delay(); const i = clientes.findIndex(c => c.id_cliente === id); if (i >= 0) clientes[i] = { ...clientes[i], ...data }; return {} },
  deleteCliente: async (id) => { await delay(); const i = clientes.findIndex(c => c.id_cliente === id); if (i >= 0) clientes.splice(i, 1); return {} },

  // Proveedores
  getProveedores: async () => { await delay(); return [...proveedores] },
  createProveedor: async (data) => { await delay(); proveedores.push({ ...data, id_proveedor: Date.now() }); return {} },
  updateProveedor: async (id, data) => { await delay(); const i = proveedores.findIndex(p => p.id_proveedor === id); if (i >= 0) proveedores[i] = { ...proveedores[i], ...data }; return {} },
  deleteProveedor: async (id) => { await delay(); const i = proveedores.findIndex(p => p.id_proveedor === id); if (i >= 0) proveedores.splice(i, 1); return {} },

  // Ventas
  getVentas: async () => { await delay(); return [...ventas] },
  getVenta: async (id) => { await delay(); return ventas.find(v => v.id_venta === id) },
  createVenta: async (data) => { await delay(); ventas.push({ ...data, id_venta: Date.now(), fecha: new Date().toISOString().split('T')[0], total: 0, cliente_nombre: '-' }); return {} },
}