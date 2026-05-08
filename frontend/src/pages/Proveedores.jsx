import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './CRUD.css'

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', direccion: '' })
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const cargar = () => api.getProveedores().then(setProveedores)
  useEffect(() => { cargar() }, [])

  const abrirModal = (p = null) => {
    setEditando(p ? p.id_proveedor : null)
    setForm(p ? { nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', direccion: p.direccion || '' } : { nombre: '', contacto: '', telefono: '', direccion: '' })
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await api.updateProveedor(editando, form)
      else await api.createProveedor(form)
      setModal(false)
      setMensaje({ tipo: 'success', texto: editando ? 'Proveedor actualizado' : 'Proveedor creado' })
      cargar()
    } catch (err) { setMensaje({ tipo: 'error', texto: err.message }) }
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar proveedor?')) return
    try { await api.deleteProveedor(id); setMensaje({ tipo: 'success', texto: 'Proveedor eliminado' }); cargar() }
    catch (err) { setMensaje({ tipo: 'error', texto: err.message }) }
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  const filtrados = proveedores.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>🚚 Proveedores</h1>
        <button className="btn-primary" onClick={() => abrirModal()}>+ Nuevo proveedor</button>
      </div>
      {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <div className="card">
        <div className="table-toolbar">
          <input type="text" placeholder="🔍 Buscar proveedor..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="search-input" />
          <span className="table-count">{filtrados.length} proveedores</span>
        </div>
        <table>
          <thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Dirección</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtrados.map(p => (
              <tr key={p.id_proveedor}>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.contacto || '-'}</td>
                <td>{p.telefono || '-'}</td>
                <td>{p.direccion || '-'}</td>
                <td><div className="action-btns">
                  <button className="btn-outline" onClick={() => abrirModal(p)}>Editar</button>
                  <button className="btn-danger" onClick={() => eliminar(p.id_proveedor)}>Eliminar</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <form onSubmit={guardar}>
              <div className="form-group"><label>Nombre *</label><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
              <div className="form-group"><label>Contacto</label><input value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} /></div>
              <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
              <div className="form-group"><label>Dirección</label><input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} /></div>
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
