import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './CRUD.css'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '' })
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const cargar = () => api.getClientes().then(setClientes)
  useEffect(() => { cargar() }, [])

  const abrirModal = (c = null) => {
    setEditando(c ? c.id_cliente : null)
    setForm(c ? { nombre: c.nombre, correo: c.correo || '', telefono: c.telefono || '' } : { nombre: '', correo: '', telefono: '' })
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await api.updateCliente(editando, form)
      else await api.createCliente(form)
      setModal(false)
      setMensaje({ tipo: 'success', texto: editando ? 'Cliente actualizado' : 'Cliente creado' })
      cargar()
    } catch (err) { setMensaje({ tipo: 'error', texto: err.message }) }
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar cliente?')) return
    try { await api.deleteCliente(id); setMensaje({ tipo: 'success', texto: 'Cliente eliminado' }); cargar() }
    catch (err) { setMensaje({ tipo: 'error', texto: err.message }) }
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  const filtrados = clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>👥 Clientes</h1>
        <button className="btn-primary" onClick={() => abrirModal()}>+ Nuevo cliente</button>
      </div>
      {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
      <div className="card">
        <div className="table-toolbar">
          <input type="text" placeholder="🔍 Buscar cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="search-input" />
          <span className="table-count">{filtrados.length} clientes</span>
        </div>
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id_cliente}>
                <td><strong>{c.nombre}</strong></td>
                <td>{c.correo || '-'}</td>
                <td>{c.telefono || '-'}</td>
                <td><div className="action-btns">
                  <button className="btn-outline" onClick={() => abrirModal(c)}>Editar</button>
                  <button className="btn-danger" onClick={() => eliminar(c.id_cliente)}>Eliminar</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <form onSubmit={guardar}>
              <div className="form-group"><label>Nombre *</label><input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
              <div className="form-group"><label>Correo</label><input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} /></div>
              <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
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
