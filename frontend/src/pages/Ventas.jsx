import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import './CRUD.css'

const ITEM_VACIO = { id_producto: '', cantidad: 1 }

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [modal, setModal] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [form, setForm] = useState({ id_cliente: '', items: [{ ...ITEM_VACIO }] })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [v, c, p] = await Promise.all([api.getVentas(100), api.getClientes(), api.getProductos()])
      setVentas(v)
      setClientes(c)
      setProductos(p)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const formatCOP = (n) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

  const precioDe = (id) => {
    const prod = productos.find(p => p.id_producto === Number(id))
    return prod ? Number(prod.precio) : 0
  }

  const stockDe = (id) => {
    const prod = productos.find(p => p.id_producto === Number(id))
    return prod ? prod.cantidad_stock : 0
  }

  const addItem = () =>
    setForm(prev => ({ ...prev, items: [...prev.items, { ...ITEM_VACIO }] }))

  const removeItem = (i) => {
    if (form.items.length === 1) return
    const items = [...form.items]
    items.splice(i, 1)
    setForm(prev => ({ ...prev, items }))
  }

  const updateItem = (i, field, value) => {
    const items = [...form.items]
    items[i] = { ...items[i], [field]: value }
    setForm(prev => ({ ...prev, items }))
  }

  const total = form.items.reduce((s, it) => s + (Number(it.cantidad) || 0) * precioDe(it.id_producto), 0)

  const abrirDetalle = async (id) => {
    setCargandoDetalle(true)
    setDetalle({ id_venta: id })
    try {
      setDetalle(await api.getVenta(id))
    } catch (err) {
      setDetalle(null)
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargandoDetalle(false)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()

    const items = form.items.filter(it => it.id_producto)
    if (!items.length) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un producto' })
      return
    }

    const sinStock = items.find(it => Number(it.cantidad) > stockDe(it.id_producto))
    if (sinStock) {
      setMensaje({ tipo: 'error', texto: 'La cantidad supera el stock disponible de un producto' })
      return
    }

    setGuardando(true)
    try {
      const data = await api.createVenta({
        id_cliente: form.id_cliente || null,
        productos: items.map(it => ({
          id_producto: Number(it.id_producto),
          cantidad: Number(it.cantidad)
        }))
      })
      setModal(false)
      setForm({ id_cliente: '', items: [{ ...ITEM_VACIO }] })
      setMensaje({ tipo: 'success', texto: `Venta #${data.id_venta} registrada por ${formatCOP(data.total)}` })
      cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4500)
    }
  }

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Ventas</h1>
        <div className="action-btns">
          <button className="btn-outline" onClick={cargar} disabled={cargando}>Actualizar</button>
          <button className="btn-primary" onClick={() => setModal(true)}>+ Registrar venta</button>
        </div>
      </div>

      {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="card">
        {cargando ? (
          <div className="table-loading">Cargando ventas...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Vendedor</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id_venta}>
                  <td><strong>#{v.id_venta}</strong></td>
                  <td>{new Date(v.fecha).toLocaleString('es-CO')}</td>
                  <td>{v.cliente_nombre || 'Consumidor final'}</td>
                  <td>{v.vendedor_nombre || 'Usuario eliminado'}</td>
                  <td className="mono"><strong>{formatCOP(v.total)}</strong></td>
                  <td>
                    <button className="btn-outline" onClick={() => abrirDetalle(v.id_venta)}>Ver detalle</button>
                  </td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#999' }}>
                    Aún no hay ventas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h2>Registrar venta</h2>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Cliente (opcional)</label>
                <select value={form.id_cliente} onChange={e => setForm({ ...form, id_cliente: e.target.value })}>
                  <option value="">Consumidor final</option>
                  {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="venta-builder">
                <h3>Productos</h3>
                {productos.filter(p => Number(p.cantidad_stock) > 0).length === 0 && (
                  <p className="venta-nota">No hay productos con stock disponible. Agrega existencias desde Inventario.</p>
                )}
                {form.items.map((item, i) => {
                  const stock = stockDe(item.id_producto)
                  return (
                    <div className="venta-item" key={i}>
                      <select
                        value={item.id_producto}
                        onChange={e => updateItem(i, 'id_producto', e.target.value)}
                        required
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos.filter(p => Number(p.cantidad_stock) > 0).map(p => (
                          <option key={p.id_producto} value={p.id_producto}>
                            {p.nombre} (stock: {p.cantidad_stock})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        max={stock || undefined}
                        value={item.cantidad}
                        onChange={e => updateItem(i, 'cantidad', e.target.value)}
                        required
                      />
                      <span className="venta-subtotal">
                        {formatCOP((Number(item.cantidad) || 0) * precioDe(item.id_producto))}
                      </span>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => removeItem(i)}
                        disabled={form.items.length === 1}
                      >
                        Quitar
                      </button>
                    </div>
                  )
                })}
                <button type="button" className="add-product-btn" onClick={addItem}>+ Agregar producto</button>
                <p className="venta-nota">El precio se toma automáticamente del inventario al registrar la venta.</p>
                <div className="venta-total">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Registrando...' : 'Registrar venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            {cargandoDetalle ? (
              <div className="table-loading">Cargando detalle...</div>
            ) : (
              <>
                <h2>Venta #{detalle.id_venta}</h2>
                <div className="detalle-meta">
                  <div><span>Fecha</span><strong>{new Date(detalle.fecha).toLocaleString('es-CO')}</strong></div>
                  <div><span>Cliente</span><strong>{detalle.cliente_nombre || 'Consumidor final'}</strong></div>
                  <div><span>Vendedor</span><strong>{detalle.vendedor_nombre || 'Usuario eliminado'}</strong></div>
                  <div><span>Total</span><strong>{formatCOP(detalle.total)}</strong></div>
                </div>
                <table className="detalle-tabla">
                  <thead>
                    <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {(detalle.detalles || []).map(d => (
                      <tr key={d.id_detalle}>
                        <td>{d.producto_nombre}</td>
                        <td className="mono">{d.cantidad}</td>
                        <td className="mono">{formatCOP(d.precio_unitario)}</td>
                        <td className="mono"><strong>{formatCOP(d.subtotal)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="modal-footer">
                  <button className="btn-primary" onClick={() => setDetalle(null)}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
