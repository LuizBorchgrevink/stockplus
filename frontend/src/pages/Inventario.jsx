import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './CRUD.css'

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', cantidad_stock: '', stock_minimo: 5, id_proveedor: '' })
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const cargar = async () => {
    const [prods, provs] = await Promise.all([api.getProductos(), api.getProveedores()])
    setProductos(prods)
    setProveedores(provs)
  }

  useEffect(() => { cargar() }, [])

  const abrirModal = (producto = null) => {
    if (producto) {
      setEditando(producto.id_producto)
      setForm({ nombre: producto.nombre, descripcion: producto.descripcion || '', precio: producto.precio, cantidad_stock: producto.cantidad_stock, stock_minimo: producto.stock_minimo, id_proveedor: producto.id_proveedor || '' })
    } else {
      setEditando(null)
      setForm({ nombre: '', descripcion: '', precio: '', cantidad_stock: '', stock_minimo: 5, id_proveedor: '' })
    }
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await api.updateProducto(editando, form)
      } else {
        await api.createProducto(form)
      }
      setModal(false)
      setMensaje({ tipo: 'success', texto: editando ? 'Producto actualizado' : 'Producto creado exitosamente' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await api.deleteProducto(id)
      setMensaje({ tipo: 'success', texto: 'Producto eliminado' })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>📦 Inventario</h1>
        <button className="btn-primary" onClick={() => abrirModal()}>+ Nuevo producto</button>
      </div>

      {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="search-input"
          />
          <span className="table-count">{filtrados.length} productos</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Proveedor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(p => (
              <tr key={p.id_producto}>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.descripcion || '-'}</td>
                <td className="mono">{formatCOP(p.precio)}</td>
                <td className="mono">{p.cantidad_stock}</td>
                <td>
                  <span className={`badge ${p.cantidad_stock === 0 ? 'badge-danger' : p.cantidad_stock <= p.stock_minimo ? 'badge-warning' : 'badge-success'}`}>
                    {p.cantidad_stock === 0 ? 'Agotado' : p.cantidad_stock <= p.stock_minimo ? 'Stock bajo' : 'OK'}
                  </span>
                </td>
                <td>{p.proveedor_nombre || '-'}</td>
                <td>
                  <div className="action-btns">
                    <button className="btn-outline" onClick={() => abrirModal(p)}>Editar</button>
                    <button className="btn-danger" onClick={() => eliminar(p.id_producto)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid var(--border)', fontFamily: 'inherit' }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio *</label>
                  <input type="number" min="1" step="0.01" value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Stock actual *</label>
                  <input type="number" min="0" value={form.cantidad_stock} onChange={e => setForm({ ...form, cantidad_stock: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock mínimo</label>
                  <input type="number" min="0" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Proveedor</label>
                  <select value={form.id_proveedor} onChange={e => setForm({ ...form, id_proveedor: e.target.value })}>
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">{editando ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
