import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './CRUD.css'

export default function Clientes() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'

  const [clientes, setClientes] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '' })
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setClientes(await api.getClientes())
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const aviso = (tipo, texto) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3500)
  }

  const abrirModal = (c = null) => {
    setEditando(c ? c.id_cliente : null)
    setForm(c ? { nombre: c.nombre, correo: c.correo || '', telefono: c.telefono || '' } : { nombre: '', correo: '', telefono: '' })
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      if (editando) await api.updateCliente(editando, form)
      else await api.createCliente(form)
      setModal(false)
      aviso('success', editando ? 'Cliente actualizado' : 'Cliente creado')
      cargar()
    } catch (err) {
      aviso('error', err.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar el cliente "${nombre}"?\n\nSolo es posible si no tiene ventas registradas.`)) return
    try {
      await api.deleteCliente(id)
      aviso('success', 'Cliente eliminado')
      cargar()
    } catch (err) {
      aviso('error', err.message)
    }
  }

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.correo || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  const columnas = esAdmin ? 4 : 3

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button className="btn-primary" onClick={() => abrirModal()}>+ Nuevo cliente</button>
      </div>

      {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Buscar cliente por nombre o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="search-input"
          />
          <span className="table-count">{filtrados.length} clientes</span>
        </div>

        {cargando ? (
          <div className="table-loading">Cargando clientes...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(c => (
                <tr key={c.id_cliente}>
                  <td><strong>{c.nombre}</strong></td>
                  <td>{c.correo || '-'}</td>
                  <td>{c.telefono || '-'}</td>
                  {esAdmin && (
                    <td>
                      <div className="action-btns">
                        <button className="btn-outline" onClick={() => abrirModal(c)}>Editar</button>
                        <button className="btn-danger" onClick={() => eliminar(c.id_cliente, c.nombre)}>Eliminar</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={columnas} style={{ textAlign: 'center', padding: 30, color: '#999' }}>
                    {busqueda ? 'No se encontraron clientes con esa búsqueda' : 'No hay clientes registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Correo</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={e => setForm({ ...form, correo: e.target.value })}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  maxLength={20}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
