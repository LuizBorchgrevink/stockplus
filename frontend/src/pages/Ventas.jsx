import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './CRUD.css'

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [modal, setModal] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [form, setForm] = useState({ id_cliente: '', items: [{ id_producto: '', cantidad: 1, precio_unitario: 0 }] })

  const cargar = async () => {
    const [v, c, p] = await Promise.all([api.getVentas(), api.getClientes(), api.getProductos()])
    setVentas(v); setClientes(c); setProductos(p)
  }

  useEffect(() => { cargar() }, [])

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { id_producto: '', cantidad: 1, precio_unitario: 0 }] })

  const removeItem = (i) => {
    if (form.items.length === 1) return
    const items = [...form.items]
    items.splice(i, 1)
    setForm({ ...form, items })
  }

  const updateItem = (i, field, value) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    if (field === 'id_producto') {
      const prod = productos.find(p => p.id_producto === parseInt(value))
      if (prod) items[i].precio_unitario = prod.precio
    }
    setForm({ ...form, items })
  }

  const total = form.items.reduce((s, it) => s + (it.cantidad * it.precio_unitario), 0)

  const guardar = async (e) => {
    e.preventDefault()
    const payload = {
      id_cliente: form.id_cliente || null,
      productos: form.items.filter(it => it.id_producto).map(it => ({
        id_producto: parseInt(it.id_producto),
        cantidad: parseInt(it.cantidad),
        precio_unitario: parseFloat(it.precio_unitario)
      }))
    }
    if (!payload.productos.length) { setMensaje({ tipo: 'error', texto: 'Agrega al menos un producto' }); return }
    try {
      await api.createVenta(payload)
      setModal(false)
      setMensaje({ tipo: 'success', texto: 'Venta registrada exitosamente' })
      setForm({ id_cliente: '', items: [{ id_producto: '', cantidad: 1, precio_unitario: 0 }] })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000)
  }

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>💰 Ventas</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Registrar venta</button>
      </div>

      {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="card">
        <table>
          <thead>
            <tr><th>#Venta</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Total</th></tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id_venta}>
                <td><strong>#{v.id_venta}</strong></td>
                <td>{new Date(v.fecha).toLocaleString('es-CO')}</td>
                <td>{v.cliente_nombre || 'Sin cliente'}</td>
                <td>{v.vendedor_nombre}</td>
                <td className="mono"><strong>{formatCOP(v.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <h2>Registrar venta</h2>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Cliente (opcional)</label>
                <select value={form.id_cliente} onChange={e => setForm({ ...form, id_cliente: e.target.value })}>
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="venta-builder">
                <h3>Productos</h3>
                {form.items.map((item, i) => (
                  <div className="venta-item" key={i}>
                    <select value={item.id_producto} onChange={e => updateItem(i, 'id_producto', e.target.value)} required>
                      <option value="">Seleccionar...</option>
                      {productos.map(p => (
                        <option key={p.id_producto} value={p.id_producto} disabled={p.cantidad_stock === 0}>
                          {p.nombre} (Stock: {p.cantidad_stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number" min="1" value={item.cantidad}
                      onChange={e => updateItem(i, 'cantidad', parseInt(e.target.value))}
                      style={{ width: 70 }}
                    />
                    <span className="venta-subtotal">{formatCOP(item.cantidad * item.precio_unitario)}</span>
                    <button type="button" className="btn-danger" onClick={() => removeItem(i)}>✕</button>
                  </div>
                ))}
                <button type="button" className="add-product-btn" onClick={addItem}>+ Agregar producto</button>
                <div className="venta-total">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar venta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
